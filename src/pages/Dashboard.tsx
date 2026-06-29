import { Bar, BarChart, CartesianGrid, XAxis, PieChart, Pie, Cell } from 'recharts'
import { Users, TrendingUp, DollarSign, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { leadPerformanceData, productDistributionData, mockActivities } from '@/lib/mock'

export default function Dashboard() {
  const barConfig = {
    leads: { label: 'Novos Leads', color: 'hsl(var(--chart-1))' },
    converted: { label: 'Convertidos', color: 'hsl(var(--success))' },
  }

  const pieConfig = {
    auto: { label: 'Seguro Auto', color: 'hsl(var(--chart-1))' },
    consorcio: { label: 'Consórcio', color: 'hsl(var(--chart-2))' },
    vida: { label: 'Seguro de Vida', color: 'hsl(var(--chart-3))' },
    saude: { label: 'Plano de Saúde', color: 'hsl(var(--chart-4))' },
  }

  const pieDataWithColors = productDistributionData.map((d) => ({
    ...d,
    fill: d.fill
      .replace('var(--color-auto)', 'hsl(var(--chart-1))')
      .replace('var(--color-consorcio)', 'hsl(var(--chart-2))')
      .replace('var(--color-vida)', 'hsl(var(--chart-3))')
      .replace('var(--color-saude)', 'hsl(var(--chart-4))'),
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Visão Geral</h1>
        <p className="text-slate-500 mt-1">
          Acompanhe as métricas de vendas e atendimento da corretora.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Leads Hoje</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24</div>
            <p className="text-xs text-green-600 flex items-center font-medium mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +12% em relação a ontem
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Taxa de Conversão
            </CardTitle>
            <Target className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">18%</div>
            <p className="text-xs text-green-600 flex items-center font-medium mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +2.1% no mês
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Vendas do Mês</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 450k</div>
            <p className="text-xs text-green-600 flex items-center font-medium mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +15% no mês
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Leads Pendentes</CardTitle>
            <Users className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">43</div>
            <p className="text-xs text-red-500 flex items-center font-medium mt-1">
              <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" /> -5% no mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-slate-200">
          <CardHeader>
            <CardTitle>Performance de Leads</CardTitle>
            <CardDescription>Volume de captação e conversão nos últimos 30 dias.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <ChartContainer config={barConfig} className="min-h-[250px] w-full mt-4">
              <BarChart accessibilityLayer data={leadPerformanceData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="leads" fill="var(--color-leads)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="converted" fill="var(--color-converted)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader>
            <CardTitle>Interesse por Produto</CardTitle>
            <CardDescription>Distribuição dos leads qualificadados.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[250px] mt-2">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={pieDataWithColors}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                  paddingAngle={2}
                >
                  {pieDataWithColors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas interações processadas pela SDR Ana.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4">
              <Avatar className="h-10 w-10 border shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {activity.lead.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-slate-900 leading-none">{activity.lead}</p>
                <p className="text-sm text-slate-500">{activity.action}</p>
              </div>
              <div className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                {activity.time}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
