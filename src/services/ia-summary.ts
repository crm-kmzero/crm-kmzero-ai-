import { supabase } from '@/lib/supabase/client'

export async function generateIaSummary(leadId: string) {
  const { data, error } = await supabase.functions.invoke('ia-summary', {
    body: { lead_id: leadId },
  })
  return { data: data as { summary: string } | null, error }
}
