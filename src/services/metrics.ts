import { supabase } from '@/lib/supabase/client'
import type { MetricaDiaria } from '@/lib/types'

export async function fetchTodayMetrics() {
  const { data, error } = await supabase
    .from('metricas_diarias')
    .select('*')
    .order('data', { ascending: false })
    .limit(1)
    .maybeSingle()
  return { data: data as MetricaDiaria | null, error }
}
