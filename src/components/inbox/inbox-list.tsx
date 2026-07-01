import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { timeSince } from '@/lib/utils'
import type { Lead } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface InboxListProps {
  leads: Lead[]
  selectedLeadId: string | null
  onSelectLead: (lead: Lead) => void
  activeTab: 'manual' | 'auto'
  onTabChange: (tab: 'manual' | 'auto') => void
  search: string
  onSearchChange: (value: string) => void
  loading: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

function ChannelBadge({ channel }: { channel?: string | null }) {
  const normalized = (channel || 'whatsapp').toLowerCase()
  if (normalized === 'instagram')
    return (
      <span className="text-[10px] font-bold bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded">
        IG
      </span>
    )
  if (normalized === 'messenger' || normalized === 'facebook')
    return (
      <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
        FB
      </span>
    )
  return (
    <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
      WA
    </span>
  )
}

export function InboxList({
  leads,
  selectedLeadId,
  onSelectLead,
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  loading,
}: InboxListProps) {
  return (
    <div className="w-80 border-r border-white/5 flex flex-col bg-[#0B0F19] shrink-0">
      <div className="p-3 border-b border-white/5">
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => onTabChange('manual')}
            className={cn(
              'flex-1 text-xs font-medium py-2 rounded-md transition-colors',
              activeTab === 'manual'
                ? 'bg-[#00D1B2] text-black'
                : 'text-slate-400 hover:text-white',
            )}
          >
            Atendendo (Manuais)
          </button>
          <button
            onClick={() => onTabChange('auto')}
            className={cn(
              'flex-1 text-xs font-medium py-2 rounded-md transition-colors',
              activeTab === 'auto' ? 'bg-[#00D1B2] text-black' : 'text-slate-400 hover:text-white',
            )}
          >
            Ana SDR (Automáticos)
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar nome, telefone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-[#151B2C] border-white/5 text-white placeholder:text-slate-500 h-9 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 mx-2 my-1 bg-[#151B2C]" />)
        ) : leads.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Nenhum lead encontrado</p>
        ) : (
          leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => onSelectLead(lead)}
              className={cn(
                'w-full p-3 flex items-start gap-3 border-b border-white/5 transition-colors text-left',
                selectedLeadId === lead.id ? 'bg-[#151B2C]' : 'hover:bg-[#151B2C]/50',
              )}
            >
              <div className="h-10 w-10 rounded-full bg-[#00D1B2]/20 text-[#00D1B2] font-bold flex items-center justify-center text-sm shrink-0">
                {getInitials(lead.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium text-white truncate">{lead.nome}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {timeSince(lead.data_atualizacao)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <ChannelBadge channel={lead.canal_origem} />
                  <span className="text-xs text-slate-400 truncate">
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
