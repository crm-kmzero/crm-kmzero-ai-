import { useState, useRef, useEffect } from 'react'
import { CheckCheck, Paperclip, Send, Bot } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import type { Lead, InteracaoSDR } from '@/lib/types'

interface ActiveChatProps {
  lead: Lead | null
  interactions: InteracaoSDR[]
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const estagioLabels: Record<string, string> = {
  novo: 'Novo',
  contato: 'Contato',
  qualificado: 'Qualificado',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

export function ActiveChat({ lead, interactions }: ActiveChatProps) {
  const [iaAtiva, setIaAtiva] = useState(true)
  const [message, setMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (lead) setIaAtiva(lead.ia_ativa !== false)
  }, [lead])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [interactions])

  const handleToggleIA = async (checked: boolean) => {
    setIaAtiva(checked)
    if (!lead) return
    await supabase.from('leads').update({ ia_ativa: checked }).eq('id', lead.id)
  }

  const handleSend = async () => {
    if (!message.trim() || !lead) return
    await supabase.from('interacoes_sdr').insert({
      lead_id: lead.id,
      mensagem_ia: message.trim(),
      mensagem_cliente: null,
      intencao_detectada: 'manual',
      sentimento: 'neutro',
    })
    await supabase
      .from('leads')
      .update({ ultimo_contato: new Date().toISOString() })
      .eq('id', lead.id)
    setMessage('')
  }

  if (!lead) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B0F19]">
        <div className="text-center">
          <Bot className="h-12 w-12 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Selecione uma conversa para começar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0B0F19] min-w-0">
      <div className="h-16 border-b border-white/5 px-4 flex items-center justify-between bg-[#151B2C] shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-white font-semibold text-sm">{lead.nome}</h3>
            <p className="text-xs text-slate-400">{lead.telefone}</p>
          </div>
          <Badge variant="outline" className="border-[#00D1B2]/30 text-[#00D1B2] text-xs">
            {estagioLabels[lead.estagio || 'novo']}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">IA Ana</span>
          <Switch checked={iaAtiva} onCheckedChange={handleToggleIA} />
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {interactions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Nenhuma mensagem ainda</p>
        ) : (
          interactions.map((int) => (
            <div key={int.id} className="space-y-2">
              {int.mensagem_ia && (
                <div className="flex justify-end">
                  <div className="max-w-[70%] rounded-2xl rounded-tr-sm px-3 py-2 bg-[#00D1B2] text-black text-sm">
                    {int.mensagem_ia}
                    <div className="text-[10px] text-right text-black/60 mt-0.5 flex items-center justify-end gap-0.5">
                      {formatTime(int.data_hora)} <CheckCheck className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              )}
              {int.mensagem_cliente && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-2xl rounded-tl-sm px-3 py-2 bg-[#151B2C] text-slate-200 text-sm">
                    {int.mensagem_cliente}
                    <div className="text-[10px] text-right text-slate-500 mt-0.5">
                      {formatTime(int.data_hora)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="p-3 border-t border-white/5 flex items-center gap-2 bg-[#151B2C] shrink-0">
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white shrink-0">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          placeholder="Digite uma mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="bg-[#0B0F19] border-white/5 text-white placeholder:text-slate-500"
        />
        <Button
          size="icon"
          onClick={handleSend}
          className="bg-[#00D1B2] hover:bg-[#00B89E] text-black shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
