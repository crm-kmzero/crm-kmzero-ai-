import { useEffect, useState } from 'react'
import { BarChart3, Sparkles, MessageCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchTodayMetrics } from '@/services/metrics'
import type { MetricaDiaria } from '@/lib/types'

export function MetricsRibbon() {
  const [metrics, setMetrics] = useState<MetricaDiaria | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () => {
      fetchTodayMetrics().then(({ data }) => {
        if (data) setMetrics(data)
        setLoading(false)
      })
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const totalLeads = metrics
    ? metrics.leads_novos +
      metrics.leads_contatados +
      metrics.leads_qualificados +
      metrics.leads_fechados
    : 0

  const cards = [
    {
      icon: BarChart3,
      label: 'Leads Hoje',
      value: totalLeads,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Sparkles,
      label: 'Novos Hoje',
      value: metrics?.leads_novos ?? 0,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp Ativos',
      value: metrics?.total_whatsapp_ativos ?? 0,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: TrendingUp,
      label: 'Taxa Conv.',
      value: `${Math.round(metrics?.taxa_conversao ?? 0)}%`,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <Card key={i} className="border-slate-200 rounded-xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                )}
                <p className="text-xs text-slate-500">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
