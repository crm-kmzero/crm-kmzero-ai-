import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { fetchLeads, updateLeadStage } from '@/services/leads'
import type { Lead, Estagio } from '@/lib/types'
import { MetricsRibbon } from '@/components/metrics-ribbon'
import { KanbanBoard } from '@/components/kanban-board'
import { SdrCommandCenter } from '@/components/sdr-command-center'
import { HotLeads } from '@/components/hot-leads'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const loadLeads = useCallback(async () => {
    const { data } = await fetchLeads()
    if (data) setLeads(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadLeads()
    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadLeads()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadLeads])

  const handleStageChange = useCallback(async (leadId: string, newStage: Estagio) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, estagio: newStage } : l)))
    await updateLeadStage(leadId, newStage)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel SDR</h1>
        <p className="text-slate-500 text-sm mt-1">
          Monitoramento em tempo real do funil de vendas
        </p>
      </div>

      <MetricsRibbon />

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Pipeline de Vendas</CardTitle>
          <CardDescription>Arraste os cards entre as colunas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 flex-1" />
              ))}
            </div>
          ) : (
            <KanbanBoard leads={leads} onStageChange={handleStageChange} />
          )}
        </CardContent>
      </Card>

      <SdrCommandCenter />

      <HotLeads leads={leads} />
    </div>
  )
}
