import { MessageCircle, Instagram, Facebook } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChannelIconProps {
  channel?: string | null
  className?: string
}

export function ChannelIcon({ channel, className }: ChannelIconProps) {
  const normalized = (channel || 'whatsapp').toLowerCase()

  if (normalized === 'instagram') {
    return <Instagram className={cn('h-4 w-4 text-pink-500', className)} />
  }
  if (normalized === 'messenger' || normalized === 'facebook') {
    return <Facebook className={cn('h-4 w-4 text-blue-500', className)} />
  }
  return <MessageCircle className={cn('h-4 w-4 text-green-500', className)} />
}
