import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, MoreVertical, TrendingUp, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { mockSellers } from '@/lib/mock'

const sellerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  goal: z.coerce.number().min(1000, 'A meta mínima é de R$ 1.000'),
})

export default function Sellers() {
  const form = useForm<z.infer<typeof sellerSchema>>({
    resolver: zodResolver(sellerSchema),
    defaultValues: { name: '', email: '', goal: 100000 },
  })

  const onSubmit = (values: z.infer<typeof sellerSchema>) => {
    toast({
      title: 'Vendedor adicionado com sucesso',
      description: `${values.name} foi adicionado à equipe.`,
    })
    form.reset()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Equipe de Vendas</h1>
          <p className="text-slate-500 mt-1">
            Acompanhe a performance e gerencie as metas dos corretores.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Novo Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Vendedor</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: João da Silva" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Corporativo</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="joao@kmzero.com.br" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Mensal (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="1000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full">
                    Cadastrar na Equipe
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockSellers.map((seller) => {
          const progress = Math.round((seller.current / seller.goal) * 100)
          return (
            <Card key={seller.id} className="hover:shadow-md transition-all border-slate-200">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                      {seller.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{seller.name}</CardTitle>
                    <p className="text-sm text-slate-500 font-medium">{seller.role}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="-mt-2 -mr-2 text-slate-400">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Vendas no Mês</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(seller.current)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium mb-1 flex items-center justify-end">
                      <Target className="h-3 w-3 mr-1" /> Meta
                    </p>
                    <p className="text-sm font-semibold text-slate-600">
                      {formatCurrency(seller.goal)}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600">Progresso</span>
                    <span className={progress >= 100 ? 'text-success font-bold' : 'text-primary'}>
                      {progress}%
                    </span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-2.5 bg-slate-100"
                    indicatorClassName={progress >= 100 ? 'bg-success' : 'bg-primary'}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t py-3">
                <Button
                  variant="link"
                  className="w-full text-primary font-medium hover:no-underline hover:bg-primary/5"
                >
                  Ver Relatório Completo
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
