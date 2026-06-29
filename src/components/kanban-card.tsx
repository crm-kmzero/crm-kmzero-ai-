import { Badge } from '@/components/ui/badge'
import type { Lead } from '@/lib/types'
import { timeSince } from '@/lib/utils'

export function KanbanCard({ lead }: { lead: Lead }) {
  const getPriorityDisplay = (priority: number) => {
    if (priority === 3) return <span title="Prioridade Máxima">🔥🔥</span>
    if (priority === 2) return <span title="Prioridade Alta">🔥</span>
    return <span title="Prioridade Normal">⭐</span>
  }

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-slate-900 truncate">{lead.nome}</span>
        {getPriorityDisplay(lead.prioridade)}
      </div>
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs font-normal">
          {lead.produto_interesse || 'N/A'}
        </Badge>
        <span className="text-xs text-slate-400">⏱️ {timeSince(lead.data_atualizacao)}</span>
      </div>
    </div>
  )
}
