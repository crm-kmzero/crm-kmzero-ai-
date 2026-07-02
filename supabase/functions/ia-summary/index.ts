import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { lead_id } = await req.json()
    if (!lead_id) {
      return new Response(JSON.stringify({ error: 'lead_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: interactions } = await supabase
      .from('interacoes_sdr')
      .select('mensagem_ia, mensagem_cliente')
      .eq('lead_id', lead_id)
      .order('data_hora', { ascending: true })
      .limit(30)

    if (!interactions || interactions.length === 0) {
      return new Response(
        JSON.stringify({ summary: 'Sem interações suficientes para gerar resumo.' }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    const chatText = interactions
      .map((i) => `Cliente: ${i.mensagem_cliente || ''}\nAna: ${i.mensagem_ia || ''}`)
      .join('\n')

    if (!GEMINI_API_KEY) {
      const lastMsg = interactions[interactions.length - 1]
      return new Response(
        JSON.stringify({
          summary: `• Cliente iniciou conversa sobre seguro\n• ${interactions.length} mensagens trocadas\n• Última interação: ${lastMsg?.mensagem_ia || 'Sem resposta'}`,
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Resuma esta conversa em exatamente 3 pontos bullet (use •):\n\n${chatText}`,
                },
              ],
            },
          ],
        }),
      },
    )

    const data = await res.json()
    const summary =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Não foi possível gerar o resumo.'

    return new Response(JSON.stringify({ summary }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    console.error('[ia-summary] Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
