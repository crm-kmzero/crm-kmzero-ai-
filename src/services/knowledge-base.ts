import { supabase } from '@/lib/supabase/client'

export interface KnowledgeDoc {
  id: string
  produto: string | null
  conteudo: string | null
  categoria: string | null
  titulo: string | null
  subtitulo: string | null
  imagem_url: string | null
  arquivo_url: string | null
  arquivo_nome: string | null
}

export async function fetchKnowledgeDocs() {
  const { data, error } = await supabase
    .from('base_conhecimento')
    .select('*')
    .order('categoria', { ascending: true })
    .order('titulo', { ascending: true })
  return { data: data as KnowledgeDoc[] | null, error }
}

export async function fetchKnowledgeDocsByCategoria(categoria: string) {
  const { data, error } = await supabase
    .from('base_conhecimento')
    .select('*')
    .eq('categoria', categoria)
    .order('titulo', { ascending: true })
  return { data: data as KnowledgeDoc[] | null, error }
}

export async function saveKnowledgeDoc(doc: Partial<KnowledgeDoc>) {
  const { data, error } = await supabase.functions.invoke('webhook-leads', {
    body: { tipo_requisicao: 'adicionar_conhecimento', ...doc },
  })
  return { data, error }
}

export async function deleteKnowledgeDoc(id: string) {
  const { error } = await supabase.from('base_conhecimento').delete().eq('id', id)
  return { error }
}
