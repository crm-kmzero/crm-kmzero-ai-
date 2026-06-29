import { Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Lead } from '@/lib/types'

interface HotLeadsProps {
  leads: Lead[]
}

export function HotLeads({ leads }: HotLeadsProps) {
  const hotLeads = [...leads]
    .filter((l) => l.prioridade >= 2)
    .sort((a, b) => {
      if (b.prioridade !== a.prioridade) return b.prioridade - a.prioridade
      return new Date(b.data_atualizacao).getTime() - new Date(a.data_atualizacao).getTime()
    })
    .slice(0, 5)

  const getPriorityIcon = (priority: number) => {
    if (priority === 3) return <span className="text-sm">🔥🔥</span>
    if (priority === 2) return <span className="text-sm">🔥</span>
    return <span className="text-sm">⭐</span>
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">Leads Quentes 🔥</CardTitle>
        <CardDescription>Priorize os contatos de alto valor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {hotLeads.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Nenhum lead quente no momento</p>
        ) : (
          hotLeads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {getPriorityIcon(lead.prioridade)}
                <div>
                  <p className="font-semibold text-sm text-slate-900">{lead.nome}</p>
                  <p className="text-xs text-slate-500">
                    {lead.produto_interesse} • {lead.telefone}
                  </p>
                </div>
              </div>
              <Button size="sm" className="bg-[#25D366] hover:bg-[#1FB855] text-white border-0">
                <Phone className="h-3 w-3 mr-1" /> Ligar
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
