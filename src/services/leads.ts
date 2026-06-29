import { supabase } from '@/lib/supabase/client'
import type { Lead, Estagio } from '@/lib/types'

export async function fetchLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('data_criacao', { ascending: false })
  return { data: data as Lead[] | null, error }
}

export async function fetchLeadById(id: string) {
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle()
  return { data: data as Lead | null, error }
}

export async function updateLeadStage(id: string, estagio: Estagio) {
  const { data, error } = await supabase
    .from('leads')
    .update({ estagio })
    .eq('id', id)
    .select()
    .single()
  return { data: data as Lead | null, error }
}
