import { supabase } from '@/lib/supabase/client'
import type { InteracaoSDR } from '@/lib/types'

export async function fetchRecentInteractions(limit: number = 20) {
  const { data, error } = await supabase
    .from('interacoes_sdr')
    .select('*')
    .order('data_hora', { ascending: false })
    .limit(limit)
  return { data: data as InteracaoSDR[] | null, error }
}

export async function fetchInteractionsByLead(leadId: string) {
  const { data, error } = await supabase
    .from('interacoes_sdr')
    .select('*')
    .eq('lead_id', leadId)
    .order('data_hora', { ascending: true })
  return { data: data as InteracaoSDR[] | null, error }
}
