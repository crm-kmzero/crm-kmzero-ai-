import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://kmzero.com.br',
  'https://crm.kmzero.com.br',
  'https://midia.kmzero.com.br',
  'https://www.kmzero.com.br',
]

function getCorsHeaders(reqOrigin: string): Record<string, string> {
  const origin = ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, x-supabase-client-platform, apikey, content-type, x-api-key',
  }
}

const WEBHOOK_API_KEY = Deno.env.get('WEBHOOK_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Configuração das regras de distribuição de vendas por e-mail institucional
const REGRA_DISTRIBUICAO = {
  GABRIEL: { email: 'gabrielaraujo@kmzero.com.br' },
  ADRIANA: { email: 'adriana.araujo@kmzero.com.br' }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

// Determina qual corretor assume o lead com base no produto de interesse
function obterContatoCorretor(produto: string) {
  const prod = (produto ?? '').toLowerCase().trim();
  if (prod === 'auto' || prod === 'automóvel' || prod === 'automovel' || prod === 'seguro auto') {
    return REGRA_DISTRIBUICAO.GABRIEL;
  }
  return REGRA_DISTRIBUICAO.ADRIANA;
}

// Helper para gerar o vetor (embedding) usando o Gemini
async function getEmbedding(text: string): Promise<number[] | null> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
  if (!GEMINI_API_KEY) return null
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text }] }
        })
      }
    )
    const data = await res.json()
    return data?.embedding?.values || null
  } catch (err) {
    console.error('[embedding] Erro ao gerar vetor:', err)
    return null
  }
}

// Incrementador atômico de métricas (RPC com fallback robusto)
async function safeIncrementMetric(supabase: any, today: string, column: 'leads_novos' | 'leads_contatados') {
  try {
    const { error: rpcError } = await supabase.rpc('increment_metric', {
      metric_date: today,
      metric_column: column,
    })

    if (!rpcError) return

    console.warn(`[webhook-leads] RPC 'increment_metric' indisponível, executando fallback estruturado: ${rpcError.message}`)

    const { data: metricRow, error: selectError } = await supabase
      .from('metricas_diarias')
      .select(`id, ${column}`)
      .eq('data', today)
      .maybeSingle()

    if (selectError) {
      console.error('[webhook-leads] Erro no select de fallback de métricas:', JSON.stringify(selectError))
      return
    }

    if (metricRow) {
      await supabase
        .from('metricas_diarias')
        .update({ [column]: (metricRow[column] ?? 0) + 1 })
        .eq('id', metricRow.id)
    } else {
      await supabase
        .from('metricas_diarias')
        .insert({ data: today, [column]: 1 })
    }
  } catch (err) {
    console.error('[webhook-leads] Erro crítico no incremento de métricas:', err)
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin') ?? '')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== WEBHOOK_API_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // NOVA LÓGICA: Ingestão de dados na base de conhecimento [2]
  const { tipo_requisicao, produto, conteudo } = body as {
    tipo_requisicao?: string
    produto?: string
    conteudo?: string
  }

  if (tipo_requisicao === 'adicionar_conhecimento') {
    if (!produto || !conteudo) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: produto, conteudo' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1. Gera o vetor (embedding) para o texto técnico [2]
    const embedding = await getEmbedding(conteudo)
    if (!embedding) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate embedding vector' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // 2. Insere na tabela do banco [2]
    const { error: insertError } = await supabase
      .from('base_conhecimento')
      .insert({
        produto,
        conteudo,
        embedding
      })

    if (insertError) {
      console.error('[webhook-leads] Error inserting knowledge:', JSON.stringify(insertError))
      return new Response(
        JSON.stringify({ error: 'Failed to save knowledge to database' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Conhecimento salvo com sucesso na base de dados!' }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  // FLUXO NORMAL: Recebimento e processamento de leads do site [2]
  const { nome, telefone, produto_interesse, origem, email } = body as {
    nome?: string
    telefone?: string
    produto_interesse?: string
    origem?: string
    email?: string
  }

  if (!nome || !telefone || !produto_interesse || !origem) {
    return new Response(
      JSON.stringify({
        error: 'Missing required fields: nome, telefone, produto_interesse, origem',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const normalizedPhone = normalizePhone(telefone)
    
    const { data: existingLeads, error: selectLeadError } = await supabase
      .from('leads')
      .select('id, telefone')
      .ilike('telefone', `%${normalizedPhone.slice(-8)}%`)

    if (selectLeadError) {
      console.error('[webhook-leads] Erro ao buscar leads existentes:', JSON.stringify(selectLeadError))
    }

    const existingLead = existingLeads?.find((l: { telefone: string }) =>
      normalizePhone(l.telefone).endsWith(normalizedPhone.slice(-11)),
    )

    const today = new Date().toISOString().split('T')[0]

    if (existingLead) {
      await supabase
        .from('leads')
        .update({ ultimo_contato: new Date().toISOString() })
        .eq('id', existingLead.id)

      await safeIncrementMetric(supabase, today, 'leads_contatados')

      return new Response(
        JSON.stringify({ success: true, message: 'Lead updated', lead_id: existingLead.id }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const contatoCorretor = obterContatoCorretor(produto_interesse)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', contatoCorretor.email)
      .maybeSingle()

    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        nome,
        telefone,
        email: email ?? null,
        produto_interesse,
        origem,
        estagio: 'novo',
        prioridade: 1,
        vendedor_id: profileData?.id || null,
        score_sdr: 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[webhook-leads] Insert error:', JSON.stringify(insertError))
      return new Response(JSON.stringify({ error: 'Failed to create lead' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    await safeIncrementMetric(supabase, today, 'leads_novos')

    return new Response(
      JSON.stringify({ success: true, message: 'Lead created', lead_id: newLead.id }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )

  } catch (err) {
    console.error('[webhook-leads] Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})