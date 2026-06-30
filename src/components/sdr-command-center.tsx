import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchRecentInteractions } from '@/services/interactions'
import { fetchTodayMetrics } from '@/services/metrics'
import type { InteracaoSDR, MetricaDiaria } from '@/lib/types'

export function SdrCommandCenter() {
  const [interactions, setInteractions] = useState<InteracaoSDR[]>([])
  const [metrics, setMetrics] = useState<MetricaDiaria | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [intRes, metRes] = await Promise.all([fetchRecentInteractions(15), fetchTodayMetrics()])
      if (intRes.data) setInteractions(intRes.data)
      if (metRes.data) setMetrics(metRes.data)
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const atendimentos = metrics?.atendimentos_ana ?? 0
  const qualificados = metrics?.qualificados_ana ?? 0
  const taxa = atendimentos > 0 ? Math.round((qualificados / atendimentos) * 100) : 0

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2 border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Transcrição SDR Ana</CardTitle>
          <CardDescription>Interações em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : interactions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Nenhuma interação recente</p>
            ) : (
              interactions.map((int) => (
                <div key={int.id} className="space-y-2">
                  {int.mensagem_ia && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2 bg-[#25D366] text-white text-sm">
                        {int.mensagem_ia}
                      </div>
                    </div>
                  )}
                  {int.mensagem_cliente && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2 bg-[#E5E7EB] text-slate-800 text-sm">
                        {int.mensagem_cliente}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Performance da Ana</CardTitle>
          <CardDescription>Hoje</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-slate-700">
                Hoje: <span className="font-bold">{atendimentos}</span> atendimentos |{' '}
                <span className="font-bold">{qualificados}</span> qualificados ({taxa}%)
              </p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Atendimentos</span>
              <span className="font-bold text-slate-900">{atendimentos}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Qualificados</span>
              <span className="font-bold text-slate-900">{qualificados}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Taxa de Qualificação</span>
                <span className="font-bold text-green-600">{taxa}%</span>
              </div>
              <Progress value={taxa} className="h-2 bg-slate-100 [&>div]:bg-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
