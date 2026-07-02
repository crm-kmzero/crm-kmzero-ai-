import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

async function getEmbedding(text: string): Promise<number[] | null> {
  if (!GEMINI_API_KEY) return null
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
        }),
      },
    )
    const data = await res.json()
    return data?.embedding?.values || null
  } catch {
    return null
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    if (body.tipo_requisicao === 'adicionar_conhecimento') {
      const {
        id,
        produto,
        conteudo,
        categoria,
        titulo,
        subtitulo,
        imagem_url,
        arquivo_url,
        arquivo_nome,
      } = body

      const embedText = `${titulo || produto || ''} ${subtitulo || ''} ${conteudo || ''}`
      const embedding = await getEmbedding(embedText)
      const embeddingStr = embedding ? `[${embedding.join(',')}]` : null

      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      const record = {
        produto: produto || titulo || null,
        conteudo: conteudo || null,
        categoria: categoria || 'seguros',
        titulo: titulo || null,
        subtitulo: subtitulo || null,
        imagem_url: imagem_url || null,
        arquivo_url: arquivo_url || null,
        arquivo_nome: arquivo_nome || null,
        embedding: embeddingStr,
      }

      let result
      if (id) {
        result = await supabase
          .from('base_conhecimento')
          .update(record)
          .eq('id', id)
          .select()
          .single()
      } else {
        result = await supabase.from('base_conhecimento').insert(record).select().single()
      }

      return new Response(JSON.stringify({ data: result.data, error: result.error }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown request type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    console.error('[webhook-leads] Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
