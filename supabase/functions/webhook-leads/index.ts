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
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
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
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, telefone')
      .ilike('telefone', `%${normalizedPhone.slice(-8)}%`)

    const existingLead = existingLeads?.find((l: { telefone: string }) =>
      normalizePhone(l.telefone).endsWith(normalizedPhone.slice(-11)),
    )

    const today = new Date().toISOString().split('T')[0]

    if (existingLead) {
      await supabase
        .from('leads')
        .update({ ultimo_contato: new Date().toISOString() })
        .eq('id', existingLead.id)

      await supabase
        .rpc('increment_metric', {
          metric_date: today,
          metric_column: 'leads_contatados',
        })
        .catch(() => {
          // Fallback: manual upsert if RPC doesn't exist
          supabase.from('metricas_diarias').upsert(
            {
              data: today,
              leads_contatados: 1,
            },
            { onConflict: 'data' },
          )
        })

      return new Response(
        JSON.stringify({ success: true, message: 'Lead updated', lead_id: existingLead.id }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

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

    const { data: metricRow } = await supabase
      .from('metricas_diarias')
      .select('leads_novos')
      .eq('data', today)
      .single()

    if (metricRow) {
      await supabase
        .from('metricas_diarias')
        .update({ leads_novos: (metricRow.leads_novos ?? 0) + 1 })
        .eq('data', today)
    } else {
      await supabase.from('metricas_diarias').insert({ data: today, leads_novos: 1 })
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Lead created', lead_id: newLead.id }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (err) {
    console.error('[webhook-leads] Unexpected error:', JSON.stringify(err))
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
