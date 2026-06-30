import { supabase } from '@/lib/supabase/client'

export interface Profile {
  id: string
  email: string
  name: string
  role: string
  status: string
  created_at: string
}

export async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  return { data: data as Profile[] | null, error }
}

export async function inviteMember(email: string, name: string, role: string) {
  const { data, error } = await supabase.functions.invoke('invite-member', {
    body: { email, name, role },
  })
  return { data, error }
}

export async function updateProfileRole(id: string, role: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single()
  return { data: data as Profile | null, error }
}

export async function deleteProfile(id: string) {
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  return { error }
}
