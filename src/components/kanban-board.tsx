import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KanbanCard } from './kanban-card'
import type { Lead, Estagio } from '@/lib/types'

const STAGES: { id: Estagio; label: string; color: string }[] = [
  { id: 'novo', label: 'NOVO', color: '#00D1B2' },
  { id: 'contato', label: 'CONTATO', color: '#F59E0B' },
  { id: 'qualificado', label: 'QUALIFICADO', color: '#F97316' },
  { id: 'fechado', label: 'FECHADO', color: '#10B981' },
]

interface KanbanBoardProps {
  leads: Lead[]
  onStageChange: (leadId: string, newStage: Estagio) => void
  sellerMap?: Map<string, string>
}

export function KanbanBoard({ leads, onStageChange, sellerMap }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedId(leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, stage: Estagio) => {
    e.preventDefault()
    if (draggedId) {
      onStageChange(draggedId, stage)
      setDraggedId(null)
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => l.estagio === stage.id)
        return (
          <div
            key={stage.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
            className="min-w-[260px] flex-1 rounded-lg bg-[#151B2C]/50 p-3"
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
              <span className="text-sm font-bold text-slate-200">{stage.label}</span>
              <span className="text-xs font-medium text-slate-500 bg-[#0B0F19] px-2 py-0.5 rounded-full ml-auto">
                {stageLeads.length}
              </span>
            </div>
            <div className="space-y-2 min-h-[100px]">
              {stageLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className={`cursor-pointer ${draggedId === lead.id ? 'opacity-40' : ''}`}
                >
                  <KanbanCard
                    lead={lead}
                    sellerName={lead.vendedor_id ? sellerMap?.get(lead.vendedor_id) : null}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
