import { Headphones, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { timeSince } from '@/lib/utils'
import type { Lead } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { ChannelIcon } from '@/components/channel-icon'

interface InboxListProps {
  title: string
  variant: 'atendimento' | 'ia'
  leads: Lead[]
  selectedLeadId: string | null
  onSelectLead: (lead: Lead) => void
  loading: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority === 3) return <span className="text-xs">🔥🔥</span>
  if (priority === 2) return <span className="text-xs">🔥</span>
  return <span className="text-xs">⭐</span>
}

export function InboxList({
  title,
  variant,
  leads,
  selectedLeadId,
  onSelectLead,
  loading,
}: InboxListProps) {
  const accent = variant === 'atendimento' ? 'text-amber-400' : 'text-[#00D1B2]'
  const Icon = variant === 'atendimento' ? Headphones : Bot

  return (
    <div className="w-56 border-r border-white/5 flex flex-col bg-[#0B0F19] shrink-0">
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', accent)} />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <span className="ml-auto text-xs text-slate-500 bg-[#151B2C] px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 mx-2 my-1 bg-[#151B2C]" />)
        ) : leads.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">Nenhum lead</p>
        ) : (
          leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => onSelectLead(lead)}
              className={cn(
                'w-full p-2.5 flex items-start gap-2 border-b border-white/5 transition-colors text-left',
                selectedLeadId === lead.id ? 'bg-[#151B2C]' : 'hover:bg-[#151B2C]/50',
              )}
            >
              <div className="h-8 w-8 rounded-full bg-[#00D1B2]/20 text-[#00D1B2] font-bold flex items-center justify-center text-xs shrink-0">
                {getInitials(lead.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-white truncate">{lead.nome}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {timeSince(lead.data_atualizacao)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <PriorityBadge priority={lead.prioridade || 1} />
                  <ChannelIcon channel={lead.canal_origem} className="h-3 w-3" />
                  <span className="text-[10px] text-slate-400 truncate">
                    {lead.produto_interesse || 'N/A'}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
