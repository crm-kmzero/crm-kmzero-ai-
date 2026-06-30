import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { MessageCircle, Phone, Mail, ArrowLeft, Bot, User, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { fetchLeadById, updateLead } from '@/services/leads'
import { fetchInteractionsByLead } from '@/services/interactions'
import { fetchProfiles } from '@/services/team'
import type { Lead, InteracaoSDR, Estagio, ProdutoInteresse } from '@/lib/types'

interface ProfileItem {
  id: string
  name: string
  email: string
}

const leadSchema = z.object({
  estagio: z.string(),
  vendedor_id: z.string(),
  valor_estimado: z.string().optional(),
  produto_interesse: z.string().optional(),
})

const estagioLabels: Record<string, string> = {
  novo: 'Novo',
  contato: 'Contato',
  qualificado: 'Qualificado',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

const estagioColors: Record<string, string> = {
  novo: 'bg-blue-50 text-blue-700 border-blue-200',
  contato: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  qualificado: 'bg-orange-50 text-orange-700 border-orange-200',
  fechado: 'bg-green-50 text-green-700 border-green-200',
  perdido: 'bg-red-50 text-red-700 border-red-200',
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function LeadDetail() {
  const { id } = useParams()
  const [lead, setLead] = useState<Lead | null>(null)
  const [interactions, setInteractions] = useState<InteracaoSDR[]>([])
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      estagio: 'novo',
      vendedor_id: '',
      valor_estimado: '',
      produto_interesse: '',
    },
  })

  const loadData = useCallback(async () => {
    if (!id) return
    const [leadRes, intRes, profRes] = await Promise.all([
      fetchLeadById(id),
      fetchInteractionsByLead(id),
      fetchProfiles(),
    ])
    if (leadRes.data) setLead(leadRes.data)
    if (intRes.data) setInteractions(intRes.data)
    if (profRes.data) setProfiles(profRes.data as ProfileItem[])
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (lead) {
      form.reset({
        estagio: lead.estagio || 'novo',
        vendedor_id: lead.vendedor_id || '',
        valor_estimado: lead.valor_estimado?.toString() || '',
        produto_interesse: lead.produto_interesse || '',
      })
    }
  }, [lead, form])

  const onSubmit = async (values: z.infer<typeof leadSchema>) => {
    if (!id) return
    const updates: Partial<Lead> = {
      estagio: values.estagio as Estagio,
      vendedor_id: values.vendedor_id || null,
      valor_estimado: values.valor_estimado ? parseFloat(values.valor_estimado) : null,
      produto_interesse: (values.produto_interesse || null) as ProdutoInteresse | null,
    }
    const { error } = await updateLead(id, updates)
    if (!error) {
      toast({
        title: 'Lead atualizado com sucesso!',
        description: 'As alterações foram salvas no sistema.',
      })
      loadData()
    } else {
      toast({
        title: 'Erro ao atualizar lead',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!lead) {
    return <div className="p-8 text-center text-slate-500">Lead não encontrado</div>
  }

  const phoneDigits = lead.telefone.replace(/\D/g, '')
  const prioridade = lead.prioridade ?? 1
  const score = prioridade === 3 ? 90 : prioridade === 2 ? 70 : 50

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/leads">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{lead.nome}</h1>
            <Badge
              variant="outline"
              className={`${estagioColors[lead.estagio || 'novo']} text-sm px-3 py-0.5`}
            >
              {estagioLabels[lead.estagio || 'novo']}
            </Badge>
          </div>
          <p className="text-slate-500 font-medium">
            {lead.produto_interesse || 'N/A'} • Captação: {formatDate(lead.data_criacao)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 hover:text-[#25D366] border-[#25D366]/50"
            asChild
          >
            <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${phoneDigits}`}>
              <Phone className="mr-2 h-4 w-4" /> Ligar
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-12 bg-white border rounded-lg p-1">
              <TabsTrigger value="overview" className="rounded-md">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="rounded-md">
                WhatsApp IA
              </TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-md">
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Detalhes do Atendimento</CardTitle>
                  <CardDescription>Informações qualificadas pela Ana e atribuição.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="estagio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status do Lead</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="novo">Novo</SelectItem>
                                  <SelectItem value="contato">Contato</SelectItem>
                                  <SelectItem value="qualificado">Qualificado</SelectItem>
                                  <SelectItem value="fechado">Fechado</SelectItem>
                                  <SelectItem value="perdido">Perdido</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="vendedor_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendedor Atribuído</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o vendedor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">Não Atribuído</SelectItem>
                                  {profiles.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="produto_interesse"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Produto de Interesse</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o produto" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Auto">Seguro Auto</SelectItem>
                                  <SelectItem value="Consorcio">Consórcio</SelectItem>
                                  <SelectItem value="Vida">Seguro de Vida</SelectItem>
                                  <SelectItem value="Residencial">Residencial</SelectItem>
                                  <SelectItem value="Empresarial">Empresarial</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="valor_estimado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor Estimado (R$)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ex: 80000" type="number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" className="w-full sm:w-auto">
                        Salvar Alterações
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whatsapp" className="mt-4">
              <Card className="border-0 shadow-sm overflow-hidden relative">
                <div className="flex flex-col h-[500px] bg-slate-100">
                  <div className="bg-[#075E54] text-white p-4 flex items-center gap-3 shadow-md">
                    <Avatar className="h-10 w-10 border-2 border-white/20">
                      <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2" />
                      <AvatarFallback>AN</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        Ana (SDR IA){' '}
                        <Badge
                          variant="secondary"
                          className="bg-white/20 text-white hover:bg-white/30 text-[10px] px-1.5 py-0 h-4"
                        >
                          Bot
                        </Badge>
                      </div>
                      <div className="text-xs text-white/80">Atendimento automatizado Km Zero</div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {interactions.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">
                        Nenhuma interação registrada ainda
                      </p>
                    ) : (
                      interactions.map((int) => (
                        <div key={int.id} className="space-y-2">
                          {int.mensagem_ia && (
                            <div className="flex justify-start">
                              <div className="max-w-[80%] rounded-2xl rounded-tl-none px-4 py-2 bg-[#25D366] text-white text-sm shadow-sm">
                                {int.mensagem_ia}
                                <div className="text-[10px] text-right text-white/70 mt-1">
                                  {formatTime(int.data_hora)}
                                </div>
                              </div>
                            </div>
                          )}
                          {int.mensagem_cliente && (
                            <div className="flex justify-end">
                              <div className="max-w-[80%] rounded-2xl rounded-tr-none px-4 py-2 bg-[#E5E7EB] text-slate-800 text-sm shadow-sm">
                                {int.mensagem_cliente}
                                <div className="text-[10px] text-right text-slate-500 mt-1 flex justify-end items-center gap-1">
                                  {formatTime(int.data_hora)}{' '}
                                  <CheckCircle className="h-3 w-3 text-blue-500" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="bg-slate-100 p-3 flex gap-2 border-t">
                    <Input
                      placeholder="Assumir conversa e responder manualmente..."
                      className="bg-white border-transparent shadow-sm"
                    />
                    <Button
                      size="icon"
                      className="bg-[#128C7E] hover:bg-[#075E54] shadow-sm rounded-full shrink-0"
                    >
                      <MessageCircle className="h-5 w-5 text-white" />
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="relative border-l border-slate-200 ml-4 space-y-8">
                    {interactions.length > 0 &&
                      [...interactions].reverse().map((int) => (
                        <div key={int.id} className="relative pl-6">
                          <span className="absolute -left-3.5 top-1 h-7 w-7 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center text-blue-600">
                            <Bot className="h-3 w-3" />
                          </span>
                          <p className="text-sm font-semibold">Ana (IA) interagiu com o lead</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {int.mensagem_ia || int.mensagem_cliente || 'Interação registrada'}
                            {int.intencao_detectada && ` • Intenção: ${int.intencao_detectada}`}
                          </p>
                          <span className="text-xs text-slate-400 mt-2 block">
                            {formatTime(int.data_hora)} - {formatDate(int.data_hora)}
                          </span>
                        </div>
                      ))}
                    <div className="relative pl-6">
                      <span className="absolute -left-3.5 top-1 h-7 w-7 rounded-full bg-green-100 border-4 border-white flex items-center justify-center text-green-600">
                        <User className="h-3 w-3" />
                      </span>
                      <p className="text-sm font-semibold">Lead capturado</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Origem: {lead.origem || 'WhatsApp'} • Produto:{' '}
                        {lead.produto_interesse || 'N/A'}
                      </p>
                      <span className="text-xs text-slate-400 mt-2 block">
                        {formatDate(lead.data_criacao)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 bg-slate-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Score do Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-black text-primary">{score}</span>
                <span className="text-sm text-slate-500 mb-1">/100</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${score}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Baseado na prioridade e interações (IA).
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{lead.telefone}</p>
                  <p className="text-xs text-slate-500">Celular / WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {lead.email || 'Não informado'}
                  </p>
                  <p className="text-xs text-slate-500">Email</p>
                </div>
              </div>
              {lead.proxima_acao && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Próxima Ação</p>
                  <p className="text-sm text-amber-900">{lead.proxima_acao}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
