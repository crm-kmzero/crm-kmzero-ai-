import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { fetchLeads, updateLeadStage } from '@/services/leads'
import { fetchProfiles } from '@/services/team'
import { KanbanBoard } from '@/components/kanban-board'
import type { Lead, Estagio } from '@/lib/types'
import type { Profile } from '@/services/team'
import { Skeleton } from '@/components/ui/skeleton'

export default function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [sellers, setSellers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const loadLeads = useCallback(async () => {
    const { data } = await fetchLeads()
    if (data) setLeads(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadLeads()
    fetchProfiles().then(({ data }) => {
      if (data) setSellers(data)
    })
    const channel = supabase
      .channel('pipeline-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => loadLeads())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadLeads])

  const handleStageChange = async (leadId: string, newStage: Estagio) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, estagio: newStage } : l)))
    await updateLeadStage(leadId, newStage)
  }

  const sellerMap = new Map(sellers.map((s) => [s.id, s.name]))

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 bg-[#151B2C]" />
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96 w-64 bg-[#151B2C]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline de Vendas</h1>
        <p className="text-slate-400 text-sm mt-1">
          Arraste os cards para mover leads entre estágios
        </p>
      </div>
      <KanbanBoard leads={leads} onStageChange={handleStageChange} sellerMap={sellerMap} />
    </div>
  )
}
