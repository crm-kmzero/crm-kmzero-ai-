import { supabase } from '@/lib/supabase/client'

export async function uploadProductFile(
  file: File,
  type: 'image' | 'document',
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() || 'bin'
  const fileName = `${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from('produtos').upload(fileName, file, { upsert: true })

  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from('produtos').getPublicUrl(fileName)
  return { url: data.publicUrl, error: null }
}

export async function deleteProductFile(url: string): Promise<void> {
  try {
    const parts = url.split('/produtos/')
    if (parts.length > 1) {
      await supabase.storage.from('produtos').remove([parts[1]])
    }
  } catch {
    // silently ignore
  }
}
