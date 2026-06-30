import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const VERIFY_TOKEN = Deno.env.get('META_WHATSAPP_VERIFY_TOKEN') ?? ''
const ACCESS_TOKEN = Deno.env.get('META_WHATSAPP_ACCESS_TOKEN') ?? ''
const PHONE_NUMBER_ID = Deno.env.get('META_WHATSAPP_PHONE_NUMBER_ID') ?? ''
const APP_SECRET = Deno.env.get('META_APP_SECRETS') ?? ''
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function simulatedResponse(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('preç') || msg.includes('cot') || msg.includes('valor')) {
    return 'Ótimo! Vou preparar uma cotação especial para você. Um momento, por favor.'
  }
  if (
    msg.includes('olá') ||
    msg.includes('oi') ||
    msg.includes('bom dia') ||
    msg.includes('boa tarde')
  ) {
    return 'Olá! Sou a Ana, assistente virtual da Km Zero Corretora. Como posso ajudar você hoje?'
  }
  return 'Entendi! Estou aqui para ajudar. Pode me dar mais detalhes sobre o que você procura?'
}

async function generateAIResponse(customerMessage: string): Promise<string> {
  if (!GEMINI_API_KEY) return simulatedResponse(customerMessage)
  try {
    const prompt = `Você é a Ana, assistente virtual da Km Zero Corretora de Seguros e Consórcios. Responda de forma curta, amigável e direta à mensagem do cliente: "${customerMessage}"`
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    )
    const data = await res.json()
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || simulatedResponse(customerMessage)
    )
  } catch {
    return simulatedResponse(customerMessage)
  }
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

async function incrementMetric(
  supabase: ReturnType<typeof createClient>,
  column: 'leads_novos' | 'leads_contatados',
) {
  const today = new Date().toISOString().split('T')[0]
  try {
    const { data: metricRow } = await supabase
      .from('metricas_diarias')
      .select(column)
      .eq('data', today)
      .single()

    if (metricRow) {
      await supabase
        .from('metricas_diarias')
        .update({ [column]: (metricRow[column] ?? 0) + 1 })
        .eq('data', today)
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

    const { data: leads } = await supabase.from('leads').select('id, telefone')
    let lead = leads?.find((l: { telefone: string }) =>
      normalizePhone(l.telefone).endsWith(normalizedIncoming),
    )
    let isNewLead = false

    if (!lead) {
      const { data: newLead } = await supabase
        .from('leads')
        .insert({
          nome: contactName,
          telefone: fromPhone,
          estagio: 'novo',
          origem: 'whatsapp',
          prioridade: 2,
          produto_interesse: 'Outro',
          score_sdr: 0,
        })
        .select()
        .single()
      lead = newLead
      isNewLead = true
    }

    if (!lead) {
      console.error('[whatsapp-webhook] Failed to find or create lead')
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    const aiResponse = await generateAIResponse(messageText)

    await supabase.from('interacoes_sdr').insert({
      lead_id: lead.id,
      mensagem_cliente: messageText,
      mensagem_ia: aiResponse,
      intencao_detectada: messageText.toLowerCase().includes('preç') ? 'cotacao' : 'duvida',
      sentimento: 'neutro',
    })

    await supabase
      .from('leads')
      .update({ ultimo_contato: new Date().toISOString() })
      .eq('id', lead.id)

    await incrementMetric(supabase, isNewLead ? 'leads_novos' : 'leads_contatados')

    await sendWhatsAppMessage(fromPhone, aiResponse)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    console.error('[whatsapp-webhook] Unexpected error:', JSON.stringify(err))
    return new Response('OK', { status: 200, headers: corsHeaders })
  }
})
