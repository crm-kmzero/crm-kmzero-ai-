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

const REGRA_DISTRIBUICAO = {
  GABRIEL: {
    email: 'gabrielaraujo@kmzero.com.br',
    telefone: '5534992000300',
    link: 'https://wa.me/5534992000300',
  },
  ADRIANA: {
    email: 'adriana.araujo@kmzero.com.br',
    telefone: '5534984080220',
    link: 'https://wa.me/5534984080220',
  },
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function obterContatoCorretor(produto: string) {
  const prod = (produto ?? '').toLowerCase().trim()
  if (prod === 'auto' || prod === 'automóvel' || prod === 'automovel' || prod === 'seguro auto') {
    return REGRA_DISTRIBUICAO.GABRIEL
  }
  return REGRA_DISTRIBUICAO.ADRIANA
}

function extractDadosCotacao(messages: string[], product: string): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  const text = messages.join(' ')
  const placaMatch = text.match(/([A-Za-z]{3}[-]?\d[A-Za-z0-9]\d{2})/)
  if (placaMatch) data.placa = placaMatch[1].toUpperCase().replace('-', '')
  const valorMatch = text.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+\s*mil)/i)
  if (valorMatch) data.valor_mencionado = valorMatch[1]
  if (product === 'Auto' && /renova/i.test(text)) data.renovacao = true
  return Object.keys(data).length > 0 ? data : {}
}

async function sendWhatsAppMessage(to: string, text: string) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) return
  try {
    await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    })
  } catch {
    // silently fail
  }
}

function verifySignature(payload: string, signature: string | null): boolean {
  if (!APP_SECRET || !signature) return true
  try {
    const encoder = new TextEncoder()
    const key = encoder.encode(APP_SECRET)
    const data = encoder.encode(payload)
    return crypto.subtle
      .importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then((cryptoKey) => crypto.subtle.sign('HMAC', cryptoKey, data))
      .then((sig) => {
        const hashArray = Array.from(new Uint8Array(sig))
        const expected = 'sha256=' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
        return expected === signature
      })
  } catch {
    return false
  }
}

async function safeIncrementMetric(supabase: any, column: 'leads_novos' | 'leads_contatados') {
  const today = new Date().toISOString().split('T')[0]
  try {
    const { error: rpcError } = await supabase.rpc('increment_metric', {
      metric_date: today,
      metric_column: column,
    })

    if (!rpcError) return

    console.warn(
      `[whatsapp-webhook] RPC 'increment_metric' falhou, executando fallback: ${rpcError.message}`,
    )

    const { data: metricRow, error: selectError } = await supabase
      .from('metricas_diarias')
      .select(`id, ${column}`)
      .eq('data', today)
      .maybeSingle()

    if (selectError) {
      console.error(
        '[whatsapp-webhook] Erro no select de fallback de métricas:',
        JSON.stringify(selectError),
      )
      return
    }

    if (metricRow) {
      await supabase
        .from('metricas_diarias')
        .update({ [column]: (metricRow[column] ?? 0) + 1 })
        .eq('id', metricRow.id)
    } else {
      await supabase.from('metricas_diarias').insert({ data: today, [column]: 1 })
    }
  } catch (err) {
    console.error('[whatsapp-webhook] Metric increment error:', JSON.stringify(err))
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge ?? '', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }
    return new Response('Forbidden', { status: 403 })
  }

  const rawBody = await req.text()

  try {
    const signature = req.headers.get('X-Hub-Signature-256')
    if (APP_SECRET) {
      const isValid = await verifySignature(rawBody, signature)
      if (!isValid) {
        console.error('[whatsapp-webhook] Invalid signature')
        return new Response('OK', { status: 200, headers: corsHeaders })
      }
    }

    const body = JSON.parse(rawBody)
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]?.value
    const messages = changes?.messages

    if (!messages || messages.length === 0) {
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    const msg = messages[0]
    const fromPhone = msg.from
    const messageText = msg.text?.body ?? ''
    const contactName = changes?.contacts?.[0]?.profile?.name ?? 'Lead WhatsApp'
    const waId = changes?.contacts?.[0]?.wa_id ?? fromPhone
    const normalizedIncoming = normalizePhone(waId).slice(-11)

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: matchedLeads, error: selectLeadError } = await supabase
      .from('leads')
      .select(
        'id, telefone, produto_interesse, vendedor_id, estagio, prioridade, proxima_acao, ia_ativa',
      )
      .ilike('telefone', `%${normalizePhone(waId).slice(-8)}%`)

    if (selectLeadError) {
      console.error(
        '[whatsapp-webhook] Erro ao buscar lead existente:',
        JSON.stringify(selectLeadError),
      )
    }

    let lead = matchedLeads?.find((l: any) =>
      normalizePhone(l.telefone).endsWith(normalizedIncoming),
    )
    let isNewLead = false

    if (!lead) {
      const { data: newLead, error: insertLeadError } = await supabase
        .from('leads')
        .insert({
          nome: contactName,
          telefone: fromPhone,
          estagio: 'novo',
          origem: 'whatsapp',
          prioridade: 2,
          produto_interesse: 'Outro',
          score_sdr: 0,
          ia_ativa: true,
        })
        .select()
        .single()

      if (insertLeadError) {
        console.error(
          '[whatsapp-webhook] Erro ao cadastrar novo lead:',
          JSON.stringify(insertLeadError),
        )
      }
      lead = newLead
      isNewLead = true
    }

    if (!lead) {
      console.error('[whatsapp-webhook] Failed to find or create lead')
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    if (lead.ia_ativa === false) {
      await supabase.from('interacoes_sdr').insert({
        lead_id: lead.id,
        mensagem_cliente: messageText,
        mensagem_ia: null,
        intencao_detectada: 'atendimento_humano',
        sentimento: 'neutro',
      })

      await supabase
        .from('leads')
        .update({ ultimo_contato: new Date().toISOString() })
        .eq('id', lead.id)

      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    const { data: chatHistory, error: historyError } = await supabase
      .from('interacoes_sdr')
      .select('mensagem_cliente, mensagem_ia')
      .eq('lead_id', lead.id)
      .order('data_hora', { ascending: false })
      .limit(6)

    const mappedHistory =
      chatHistory?.map((h: any) => ({
        mensagem_cliente: h.mensagem_cliente,
        mensagem_ia: h.mensagem_ia || '',
      })) || []

    if (historyError) {
      console.error(
        '[whatsapp-webhook] Erro ao buscar histórico de interações:',
        JSON.stringify(historyError),
      )
    }

    const inputProduct = analyzeProduct(messageText, lead.produto_interesse || 'Outro')
    const contatoCorretor = obterContatoCorretor(inputProduct)

    let vendedorId = lead.vendedor_id
    if (!vendedorId || inputProduct !== lead.produto_interesse) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', contatoCorretor.email)
        .maybeSingle()

      if (profileData) {
        vendedorId = profileData.id
      }
    }

    const contextoSeguro = await buscarContexto(supabase, messageText)
    const aiResponse = await generateAIResponse(messageText, mappedHistory, contextoSeguro)

    const indicaHandoff = aiResponse.includes('[CHAMAR_CORRETOR]')
    const indicaAgendamento = aiResponse.includes('[AGENDAR_CONTATO]')
    let finalResponse = aiResponse

    let estagioAtualizado = lead.estagio || 'novo'
    let prioridadeAtualizada = lead.prioridade || 2
    let proximaAcaoAtualizada = lead.proxima_acao || null
    let iaAtivaAtualizada = true

    if (indicaHandoff) {
      finalResponse = finalResponse.replace('[CHAMAR_CORRETOR]', '').trim()
      estagioAtualizado = 'qualificado'
      prioridadeAtualizada = 1
      iaAtivaAtualizada = false

      const primeiroNomeCorretor =
        contatoCorretor.email === 'gabrielaraujo@kmzero.com.br' ? 'Gabriel' : 'Adriana'
      const textoIntro = encodeURIComponent(
        `Olá, ${primeiroNomeCorretor}! Fui atendido pela Ana no sistema e gostaria de receber minha simulação de ${inputProduct}.`,
      )
      const linkWhatsApp = `${contatoCorretor.link}?text=${textoIntro}`

      finalResponse += `\n\nO especialista que cuidará do seu atendimento é o *${primeiroNomeCorretor} Araújo*. Você pode falar diretamente com ele agora mesmo clicando no link abaixo:\n👉 ${linkWhatsApp}`
    } else if (indicaAgendamento) {
      finalResponse = finalResponse.replace('[AGENDAR_CONTATO]', '').trim()
      estagioAtualizado = 'contato'
      prioridadeAtualizada = 2
      proximaAcaoAtualizada = 'Ligar para agendamento - Horário sugerido na conversa.'
    }

    const { error: insertInteractionError } = await supabase.from('interacoes_sdr').insert({
      lead_id: lead.id,
      mensagem_cliente: messageText,
      mensagem_ia: finalResponse,
      intencao_detectada: messageText.toLowerCase().includes('preç') ? 'cotacao' : 'duvida',
      sentimento: 'neutro',
    })

    if (insertInteractionError) {
      console.error(
        '[whatsapp-webhook] Erro ao inserir interação sdr:',
        JSON.stringify(insertInteractionError),
      )
    }

    const dadosCotacao = extractDadosCotacao(
      [messageText, ...mappedHistory.map((h: any) => h.mensagem_cliente || '')],
      inputProduct,
    )

    await supabase
      .from('leads')
      .update({
        produto_interesse: inputProduct,
        vendedor_id: vendedorId,
        estagio: estagioAtualizado,
        prioridade: prioridadeAtualizada,
        proxima_acao: proximaAcaoAtualizada,
        ia_ativa: iaAtivaAtualizada,
        dados_cotacao: dadosCotacao,
        ultimo_contato: new Date().toISOString(),
      })
      .eq('id', lead.id)

    await safeIncrementMetric(supabase, isNewLead ? 'leads_novos' : 'leads_contatados')
    await sendWhatsAppMessage(fromPhone, finalResponse)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    console.error('[whatsapp-webhook] Unexpected error:', err)
    return new Response('OK', { status: 200, headers: corsHeaders })
  }
})
