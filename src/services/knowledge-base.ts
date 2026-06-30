import { supabase } from '@/lib/supabase/client'

export interface KnowledgeDoc {
  id: string
  produto: string | null
  conteudo: string | null
}

export async function fetchKnowledgeDocs() {
  const { data, error } = await supabase
    .from('base_conhecimento')
    .select('*')
    .order('produto', { ascending: true })
  return { data: data as KnowledgeDoc[] | null, error }
}

export async function deleteKnowledgeDoc(id: string) {
  const { error } = await supabase.from('base_conhecimento').delete().eq('id', id)
  return { error }
}

export async function addKnowledgeDoc(produto: string, conteudo: string) {
  const { data, error } = await supabase.functions.invoke('webhook-leads', {
    body: { tipo_requisicao: 'adicionar_conhecimento', produto, conteudo },
  })
  return { data, error }
}
