import { useState } from 'react'
import { Sparkles, StickyNote, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { generateIaSummary } from '@/services/ia-summary'
import { createNote } from '@/services/notas'
import type { Lead } from '@/lib/types'
import type { NotaInterna } from '@/services/notas'

interface LeadPanelProps {
  lead: Lead | null
  notes: NotaInterna[]
  onNotesChange: () => void
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LeadPanel({ lead, notes, onNotesChange }: LeadPanelProps) {
  const { user } = useAuth()
  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  if (!lead) {
    return (
      <div className="w-80 border-l border-white/5 bg-[#0B0F19] flex items-center justify-center shrink-0">
        <p className="text-slate-500 text-sm">Nenhum lead selecionado</p>
      </div>
    )
  }

  const handleGenerateSummary = async () => {
    setLoadingSummary(true)
    const { data } = await generateIaSummary(lead.id)
    if (data) setSummary(data.summary)
    setLoadingSummary(false)
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setSavingNote(true)
    await createNote(lead.id, noteText.trim(), user?.id || null)
    setNoteText('')
    setSavingNote(false)
    onNotesChange()
  }

  const handleUpdateLead = async (field: string, value: string) => {
    await supabase
      .from('leads')
      .update({ [field]: value || null })
      .eq('id', lead.id)
  }

  return (
    <div className="w-80 border-l border-white/5 bg-[#0B0F19] flex flex-col overflow-hidden shrink-0">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-white font-semibold text-sm mb-3">Detalhes do Lead</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nome</label>
            <Input
              defaultValue={lead.nome}
              onBlur={(e) => handleUpdateLead('nome', e.target.value)}
              className="bg-[#151B2C] border-white/5 text-white text-sm h-8"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <Input
              defaultValue={lead.email || ''}
              onBlur={(e) => handleUpdateLead('email', e.target.value)}
              className="bg-[#151B2C] border-white/5 text-white text-sm h-8"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Produto</label>
            <Select
              defaultValue={lead.produto_interesse || ''}
              onValueChange={(v) => handleUpdateLead('produto_interesse', v)}
            >
              <SelectTrigger className="bg-[#151B2C] border-white/5 text-white text-sm h-8">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Auto">Auto</SelectItem>
                <SelectItem value="Consorcio">Consórcio</SelectItem>
                <SelectItem value="Vida">Vida</SelectItem>
                <SelectItem value="Residencial">Residencial</SelectItem>
                <SelectItem value="Empresarial">Empresarial</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-white/5">
        <Button
          onClick={handleGenerateSummary}
          disabled={loadingSummary}
          className="w-full bg-[#00D1B2] hover:bg-[#00B89E] text-black text-sm"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {loadingSummary ? 'Gerando...' : 'Resumo IA da Conversa'}
        </Button>
        {summary && (
          <div className="mt-2 p-3 bg-[#151B2C] rounded-lg text-sm text-slate-300 whitespace-pre-line">
            {summary}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-3">
          <StickyNote className="h-4 w-4 text-amber-400" />
          <h4 className="text-white font-semibold text-sm">Notas Internas</h4>
        </div>
        <div className="space-y-2 mb-3">
          {notes.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2">Nenhuma nota ainda</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2"
              >
                <p className="text-xs text-amber-100">{note.conteudo}</p>
                <p className="text-[10px] text-amber-400/60 mt-1">
                  {formatDateTime(note.data_criacao || '')}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nova nota..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !savingNote && handleAddNote()}
            className="bg-[#151B2C] border-white/5 text-white text-sm h-8"
          />
          <Button
            size="icon"
            onClick={handleAddNote}
            disabled={savingNote}
            className="bg-[#00D1B2] hover:bg-[#00B89E] text-black shrink-0 h-8 w-8"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
