import { useParams, Link } from 'react-router-dom'
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
import { toast } from '@/hooks/use-toast'
import { mockLeads } from '@/lib/mock'

const leadSchema = z.object({
  status: z.string(),
  seller: z.string(),
  value: z.string().optional(),
})

const statusColors: Record<string, string> = {
  Novo: 'bg-blue-50 text-blue-700 border-blue-200',
  'Em Atendimento': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Morno: 'bg-orange-50 text-orange-700 border-orange-200',
  Ganho: 'bg-green-50 text-green-700 border-green-200',
  Perdido: 'bg-red-50 text-red-700 border-red-200',
}

export default function LeadDetail() {
  const { id } = useParams()
  const lead = mockLeads.find((l) => l.id === id)

  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      status: lead?.status || 'Novo',
      seller: lead?.seller || 'Não Atribuído',
      value: lead?.value || '',
    },
  })

  if (!lead) return <div className="p-8 text-center text-slate-500">Lead não encontrado</div>

  const onSubmit = (values: z.infer<typeof leadSchema>) => {
    toast({
      title: 'Lead atualizado com sucesso!',
      description: 'As alterações foram salvas no sistema.',
    })
  }

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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{lead.name}</h1>
            <Badge variant="outline" className={`${statusColors[lead.status]} text-sm px-3 py-0.5`}>
              {lead.status}
            </Badge>
          </div>
          <p className="text-slate-500 font-medium">
            {lead.product} • Captação: {lead.date}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 hover:text-[#25D366] border-[#25D366]/50"
          >
            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
          </Button>
          <Button variant="outline" size="sm">
            <Phone className="mr-2 h-4 w-4" /> Ligar
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
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status do Lead</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Novo">Novo</SelectItem>
                                  <SelectItem value="Em Atendimento">Em Atendimento</SelectItem>
                                  <SelectItem value="Morno">Morno</SelectItem>
                                  <SelectItem value="Ganho">Ganho</SelectItem>
                                  <SelectItem value="Perdido">Perdido</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="seller"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendedor Atribuído</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o vendedor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Não Atribuído">Não Atribuído</SelectItem>
                                  <SelectItem value="Adriana">Adriana</SelectItem>
                                  <SelectItem value="Gabriel">Gabriel</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Estimado / Detalhes do Produto</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: R$ 80.000 (Jeep Compass)" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full sm:w-auto">
                        Salvar Alterações
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whatsapp" className="mt-4">
              <Card className="border-0 shadow-sm overflow-hidden bg-[url('https://img.usecurling.com/p/800/800?q=texture&color=gray&dpr=1')] bg-cover relative">
                <div className="absolute inset-0 bg-slate-100/90 backdrop-blur-sm z-0"></div>
                <div className="relative z-10 flex flex-col h-[500px]">
                  <div className="bg-[#075E54] text-white p-4 flex items-center gap-3 shadow-md z-10">
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
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-white p-3 rounded-xl rounded-tl-none w-max max-w-[80%] shadow-sm text-sm text-slate-800">
                      Olá, {lead.name.split(' ')[0]}! Tudo bem? Sou a Ana da Km Zero. Vi que você
                      tem interesse em {lead.product}. Posso te ajudar com uma cotação rápida?
                      <div className="text-[10px] text-right text-slate-400 mt-1">10:45</div>
                    </div>
                    <div className="bg-[#DCF8C6] p-3 rounded-xl rounded-tr-none w-max max-w-[80%] shadow-sm text-sm ml-auto text-slate-900">
                      Oi Ana, tenho interesse sim.
                      <div className="text-[10px] text-right text-slate-500 mt-1 flex justify-end items-center gap-1">
                        10:48 <CheckCircle className="h-3 w-3 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl rounded-tl-none w-max max-w-[80%] shadow-sm text-sm text-slate-800">
                      Ótimo! Para eu buscar as melhores condições, me dê mais alguns detalhes.{' '}
                      {lead.product === 'Seguro Auto'
                        ? 'Qual é o modelo e ano do seu carro?'
                        : 'Qual o valor aproximado que você busca?'}
                      <div className="text-[10px] text-right text-slate-400 mt-1">10:49</div>
                    </div>
                    {lead.value && (
                      <div className="bg-[#DCF8C6] p-3 rounded-xl rounded-tr-none w-max max-w-[80%] shadow-sm text-sm ml-auto text-slate-900">
                        {lead.value}
                        <div className="text-[10px] text-right text-slate-500 mt-1 flex justify-end items-center gap-1">
                          10:52 <CheckCircle className="h-3 w-3 text-blue-500" />
                        </div>
                      </div>
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
                    <div className="relative pl-6">
                      <span className="absolute -left-3.5 top-1 h-7 w-7 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center text-blue-600">
                        <Bot className="h-3 w-3" />
                      </span>
                      <p className="text-sm font-semibold">Ana (IA) qualificou o lead</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Identificou interesse em {lead.product} e coletou detalhes: {lead.value}
                      </p>
                      <span className="text-xs text-slate-400 mt-2 block">10:55 - {lead.date}</span>
                    </div>
                    <div className="relative pl-6">
                      <span className="absolute -left-3.5 top-1 h-7 w-7 rounded-full bg-green-100 border-4 border-white flex items-center justify-center text-green-600">
                        <User className="h-3 w-3" />
                      </span>
                      <p className="text-sm font-semibold">Lead capturado</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Origem: Campanha Meta Ads (WhatsApp)
                      </p>
                      <span className="text-xs text-slate-400 mt-2 block">10:45 - {lead.date}</span>
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
                <span className="text-4xl font-black text-primary">{lead.score}</span>
                <span className="text-sm text-slate-500 mb-1">/100</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${lead.score}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Baseado nas interações e completude dos dados (IA).
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
                  <p className="text-sm font-medium text-slate-900">{lead.phone}</p>
                  <p className="text-xs text-slate-500">Celular / WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Não informado</p>
                  <p className="text-xs text-slate-500">Email</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
