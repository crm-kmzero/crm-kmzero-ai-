import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChannelIcon } from '@/components/channel-icon'
import type { Lead } from '@/lib/types'
import { timeSince } from '@/lib/utils'

interface KanbanCardProps {
  lead: Lead
  sellerName?: string | null
}

export function KanbanCard({ lead, sellerName }: KanbanCardProps) {
  const isHot = lead.prioridade === 1 || lead.estagio === 'qualificado'

  const getPriorityBadge = () => {
    if (lead.prioridade === 1) return <span title="Quente">🔥🔥</span>
    if (lead.prioridade === 2) return <span title="Morno">🔥</span>
    if (lead.estagio === 'qualificado') return <span title="Qualificado">⭐</span>
    return null
  }

  const sellerInitials = sellerName
    ? sellerName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : null

  const waLink = `https://wa.me/${lead.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá ${lead.nome}! Sou da Km Zero Corretora, vou te ajudar com seu atendimento.`,
  )}`

  return (
    <div className="bg-[#151B2C] rounded-lg p-3 shadow-sm border border-white/5 hover:border-[#00D1B2]/30 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <ChannelIcon channel={lead.canal_origem} className="h-3.5 w-3.5 shrink-0" />
          <span className="font-bold text-sm text-white truncate">{lead.nome}</span>
        </div>
        {getPriorityBadge()}
      </div>
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary" className="text-xs font-normal bg-white/5 text-slate-300">
          {lead.produto_interesse || 'N/A'}
        </Badge>
        <span className="text-xs text-slate-500">⏱️ {timeSince(lead.data_atualizacao)}</span>
      </div>
      <div className="flex items-center justify-between">
        {sellerInitials ? (
          <div className="flex items-center gap-1">
            <div className="h-5 w-5 rounded-full bg-[#00D1B2]/20 text-[#00D1B2] text-[10px] font-bold flex items-center justify-center">
              {sellerInitials}
            </div>
            <span className="text-[10px] text-slate-400">{sellerName?.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-500">Sem vendedor</span>
        )}
        {isHot && (
          <Button
            size="sm"
            className="h-6 text-[10px] px-2 bg-[#25D366] hover:bg-[#1FB855] text-white border-0"
            asChild
          >
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              Ligar agora
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
