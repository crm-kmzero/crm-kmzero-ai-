import { supabase } from '@/lib/supabase/client'

export interface NotaInterna {
  id: string
  lead_id: string | null
  corretor_id: string | null
  conteudo: string
  data_criacao: string | null
}

export async function fetchNotesByLead(leadId: string) {
  const { data, error } = await supabase
    .from('notas_internas')
    .select('*')
    .eq('lead_id', leadId)
    .order('data_criacao', { ascending: false })
  return { data: data as NotaInterna[] | null, error }
}

export async function createNote(leadId: string, conteudo: string, corretorId: string | null) {
  const { data, error } = await supabase
    .from('notas_internas')
    .insert({ lead_id: leadId, conteudo, corretor_id: corretorId })
    .select()
    .single()
  return { data: data as NotaInterna | null, error }
}
