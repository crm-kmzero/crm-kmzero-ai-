import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { buscarContexto, generateAIResponse, analyzeProduct } from '../_shared/ai.ts'

const VERIFY_TOKEN = Deno.env.get('META_WHATSAPP_VERIFY_TOKEN') ?? ''
const ACCESS_TOKEN = Deno.env.get('META_WHATSAPP_ACCESS_TOKEN') ?? ''
const PHONE_NUMBER_ID = Deno.env.get('META_WHATSAPP_PHONE_NUMBER_ID') ?? ''
const APP_SECRET = Deno.env.get('META_APP_SECRETS') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const CORRETORES = {
  GABRIEL: { email: 'gabrielaraujo@kmzero.com.br', link: 'https://wa.me/5534992000300' },
  ADRIANA: { email: 'adriana.araujo@kmzero.com.br', link: 'https://wa.me/5534984080220' },
}

const normPhone = (p: string) => p.replace(/\D/g, '')
const obterCorretor = (produto: string) => {
  const p = (produto ?? '').toLowerCase().trim()
  return (p === 'auto' || p.includes('autom')) ? CORRETORES.GABRIEL : CORRETORES.ADRIANA
}

async function sendMessage(channel: string, to: string, text: string) {
  if (!ACCESS_TOKEN) return
  try {
    if (channel === 'whatsapp') {
      await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST', headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
      })
    } else {
      await fetch('https://graph.facebook.com/v18.0/me/messages', {
        method: 'POST', headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: { id: to }, message: { text } }),
      })
    }
  } catch { /* ignore */ }
}

async function verifySig(payload: string, sig: string | null): Promise<boolean> {
  if (!APP_SECRET || !sig) return true
  try {
    const key = new TextEncoder().encode(APP_SECRET)
    const data = new TextEncoder().encode(payload)
    return crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then(k => crypto.subtle.sign('HMAC', k, data))
      .then(s => 'sha256=' + Array.from(new Uint8Array(s)).map(b => b.toString(16).padStart(2, '0')).join('') === sig)
  } catch { return false }
}

interface ParsedMsg { channel: string; senderId: string; text: string; name: string }

function parsePayload(body: any): ParsedMsg | null {
  const entry = body?.entry?.[0]
  if (!entry) return null
  const wa = entry?.changes?.[0]?.value
  if (wa?.messages?.length > 0) {
    return { channel: 'whatsapp', senderId: wa.messages[0].from, text: wa.messages[0].text?.body ?? '', name: wa?.contacts?.[0]?.profile?.name ?? 'Lead WhatsApp' }
  }
  const msg = entry?.messaging?.[0]
  if (msg?.message?.text) {
    const isIG = body?.object === 'instagram'
    return { channel: isIG ? 'instagram' : 'messenger', senderId: msg.sender.id, text: msg.message.text, name: 'Lead ' + (isIG ? 'Instagram' : 'Messenger') }
  }
  return null
}

async function incMetric(supabase: any, col: string) {
  const today = new Date().toISOString().split('T')[0]
  try {
    const { data: row } = await supabase.from('metricas_diarias').select(`id, ${col}`).eq('data', today).maybeSingle()
    if (row) await supabase.from('metricas_diarias').update({ [col]: (row[col] ?? 0) + 1 }).eq('id', row.id)
    else await supabase.from('metricas_diarias').insert({ data: today, [col]: 1 })
  } catch { /* ignore */ }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method === 'GET') {
    const url = new URL(req.url)
    if (url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === VERIFY_TOKEN)
      return new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200, headers: { 'Content-Type': 'text/plain' } })
    return new Response('Forbidden', { status: 403 })
  }

  const rawBody = await req.text()
  try {
    if (APP_SECRET && !await verifySig(rawBody, req.headers.get('X-Hub-Signature-256')))
      return new Response('OK', { status: 200, headers: corsHeaders })

    const parsed = parsePayload(JSON.parse(rawBody))
    if (!parsed || !parsed.text) return new Response('OK', { status: 200, headers: corsHeaders })

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
    const searchStr = parsed.channel === 'whatsapp' ? normPhone(parsed.senderId).slice(-8) : parsed.senderId
    const { data: existingLeads } = await supabase.from('leads').select('*').ilike('telefone', `%${searchStr}%`)
    let lead = existingLeads?.find((l: any) =>
      parsed.channel === 'whatsapp' ? normPhone(l.telefone).endsWith(normPhone(parsed.senderId).slice(-11)) : l.telefone === parsed.senderId
    )
    let isNew = false

    if (!lead) {
      const { data: newLead } = await supabase.from('leads').insert({
        nome: parsed.name, telefone: parsed.senderId, estagio: 'novo', origem: 'whatsapp',
        canal_origem: parsed.channel, prioridade: 2, produto_interesse: 'Outro', score_sdr: 0, ia_ativa: true,
      }).select().single()
      lead = newLead; isNew = true
    }
    if (!lead) return new Response('OK', { status: 200, headers: corsHeaders })

    if (lead.ia_ativa === false) {
      await supabase.from('interacoes_sdr').insert({ lead_id: lead.id, mensagem_cliente: parsed.text, intencao_detectada: 'atendimento_humano', sentimento: 'neutro' })
      await supabase.from('leads').update({ ultimo_contato: new Date().toISOString(), canal_origem: parsed.channel }).eq('id', lead.id)
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    const { data: history } = await supabase.from('interacoes_sdr').select('mensagem_cliente, mensagem_ia').eq('lead_id', lead.id).order('data_hora', { ascending: false }).limit(6)
    const produto = analyzeProduct(parsed.text, lead.produto_interesse || 'Outro')
    const corretor = obterCorretor(produto)
    const contexto = await buscarContexto(supabase, parsed.text)
    let aiResponse = await generateAIResponse(parsed.text, history || [], contexto)

    let estagio = lead.estagio || 'novo', prioridade = lead.prioridade || 2, proximaAcao = lead.proxima_acao, iaAtiva = true

    if (aiResponse.includes('[CHAMAR_CORRETOR]')) {
      aiResponse = aiResponse.replace('[CHAMAR_CORRETOR]', '').trim()
      estagio = 'qualificado'; prioridade = 1; iaAtiva = false
      const nomeCorretor = corretor.email.includes('gabriel') ? 'Gabriel' : 'Adriana'
      const link = `${corretor.link}?text=${encodeURIComponent(`Olá, ${nomeCorretor}! Fui atendido pela Ana e gostaria de receber minha simulação de ${produto}.`)}`
      aiResponse += `\n\nO especialista é *${nomeCorretor} Araújo*. Fale com ele agora:\n👉 ${link}`
    } else if (aiResponse.includes('[AGENDAR_CONTATO]')) {
      aiResponse = aiResponse.replace('[AGENDAR_CONTATO]', '').trim()
      estagio = 'contato'; prioridade = 2; proximaAcao = 'Ligar para agendamento'
    }

    let vendedorId = lead.vendedor_id
    if (!vendedorId || produto !== lead.produto_interesse) {
      const { data: prof } = await supabase.from('profiles').select('id').eq('email', corretor.email).maybeSingle()
      if (prof) vendedorId = prof.id
    }

    await supabase.from('interacoes_sdr').insert({ lead_id: lead.id, mensagem_cliente: parsed.text, mensagem_ia: aiResponse, intencao_detectada: 'duvida', sentimento: 'neutro' })
    await supabase.from('leads').update({ produto_interesse: produto, vendedor_id: vendedorId, estagio, prioridade, proxima_acao: proximaAcao, ia_ativa: iaAtiva, canal_origem: parsed.channel, ultimo_contato: new Date().toISOString() }).eq('id', lead.id)
    await incMetric(supabase, isNew ? 'leads_novos' : 'leads_contatados')
    await sendMessage(parsed.channel, parsed.senderId, aiResponse)

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (err) {
    console.error('[meta-webhook] Error:', err)
    return new Response('OK', { status: 200, headers: corsHeaders })
  }
})
