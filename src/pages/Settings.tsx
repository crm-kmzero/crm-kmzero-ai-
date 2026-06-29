import { Bot, Key, UserCircle, BellRing, Save } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export default function Settings() {
  const handleSave = () => {
    toast({
      title: 'Configurações atualizadas',
      description: 'As alterações foram salvas com sucesso.',
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Configurações do Sistema
        </h1>
        <p className="text-slate-500 mt-1">
          Gerencie as preferências da IA, integrações e dados do perfil.
        </p>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="bg-slate-100/50 p-1">
          <TabsTrigger
            value="ai"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Bot className="h-4 w-4 mr-2" /> IA SDR (Ana)
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Key className="h-4 w-4 mr-2" /> Integrações
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <UserCircle className="h-4 w-4 mr-2" /> Perfil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="animate-fade-in">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Configuração de Atendimento Automatizado</CardTitle>
              <CardDescription>
                Ajuste como a Ana interage com os leads via WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="space-y-1">
                  <Label className="text-base">Ativar Atendimento 24/7</Label>
                  <p className="text-sm text-slate-500">
                    A Ana responderá a novos leads fora do horário comercial.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Saudação Inicial</Label>
                <Textarea
                  className="h-24 resize-none bg-slate-50 focus-visible:bg-white transition-colors"
                  defaultValue="Olá! Sou a Ana, assistente virtual da Km Zero Corretora. Como posso ajudar você hoje?"
                />
                <p className="text-xs text-slate-500">
                  Esta é a primeira mensagem enviada para contatos não reconhecidos.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Horário Comercial (Repasse para Vendedores)
                </Label>
                <div className="flex items-center gap-4 max-w-sm">
                  <div className="space-y-1 w-full">
                    <Label className="text-xs text-slate-500">Início</Label>
                    <Input type="time" defaultValue="09:00" className="w-full" />
                  </div>
                  <div className="space-y-1 w-full">
                    <Label className="text-xs text-slate-500">Fim</Label>
                    <Input type="time" defaultValue="18:00" className="w-full" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 border-t py-4">
              <Button onClick={handleSave} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" /> Salvar Comportamento IA
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="animate-fade-in">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Chaves de API e Webhooks</CardTitle>
              <CardDescription>Configure as integrações com serviços externos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="font-semibold">Meta Cloud API Token (WhatsApp Business)</Label>
                <Input
                  type="password"
                  defaultValue="EAAGm0PX4ZC...abcdefg12345"
                  className="font-mono bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  Token permanente gerado no painel do Facebook Developers.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">
                  Supabase Edge Function URL (Webhook do WhatsApp)
                </Label>
                <Input
                  defaultValue="https://xyz123.supabase.co/functions/v1/whatsapp-webhook"
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Google Gemini API Key</Label>
                <Input
                  type="password"
                  defaultValue="AIzaSyA..."
                  className="font-mono bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  Usado para processamento de linguagem natural da Ana.
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 border-t py-4">
              <Button onClick={handleSave} variant="secondary" className="w-full sm:w-auto">
                Atualizar Integrações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="animate-fade-in">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Seu Perfil</CardTitle>
              <CardDescription>Gerencie suas informações pessoais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input defaultValue="Adriana Gerente" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="adriana@kmzero.com.br" disabled className="bg-slate-100" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 mt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <BellRing className="h-5 w-5" />
                  </div>
                  <div>
                    <Label className="text-base">Notificações por Email</Label>
                    <p className="text-sm text-slate-500">
                      Receber resumo diário de leads processados.
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 border-t py-4">
              <Button onClick={handleSave} className="w-full sm:w-auto">
                Salvar Perfil
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
