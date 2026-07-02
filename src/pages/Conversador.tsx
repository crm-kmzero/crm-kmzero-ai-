import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { fetchLeads } from '@/services/leads'
import { fetchInteractionsByLead } from '@/services/interactions'
import { fetchNotesByLead } from '@/services/notas'
import type { Lead, InteracaoSDR } from '@/lib/types'
import type { NotaInterna } from '@/services/notas'
import { InboxList } from '@/components/inbox/inbox-list'
import { ActiveChat } from '@/components/inbox/active-chat'
import { LeadPanel } from '@/components/inbox/lead-panel'

export default function Conversador() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [interactions, setInteractions] = useState<InteracaoSDR[]>([])
  const [notes, setNotes] = useState<NotaInterna[]>([])
  const [loading, setLoading] = useState(true)
  const selectedLeadRef = useRef<string | null>(null)

  const loadLeads = useCallback(async () => {
    const { data } = await fetchLeads()
    if (data) setLeads(data)
    setLoading(false)
  }, [])

  const loadLeadDetails = useCallback(async (leadId: string) => {
    const [intRes, notesRes] = await Promise.all([
      fetchInteractionsByLead(leadId),
      fetchNotesByLead(leadId),
    ])
    if (intRes.data) setInteractions(intRes.data)
    if (notesRes.data) setNotes(notesRes.data)
  }, [])

  useEffect(() => {
    selectedLeadRef.current = selectedLead?.id ?? null
  }, [selectedLead])

  useEffect(() => {
    loadLeads()
    const channel = supabase
      .channel('conversador-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => loadLeads())
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interacoes_sdr' },
        (payload) => {
          const leadId = selectedLeadRef.current
          if (leadId && (payload.new as Record<string, unknown>)?.lead_id === leadId) {
            loadLeadDetails(leadId)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notas_internas' },
        (payload) => {
          const leadId = selectedLeadRef.current
          if (leadId && (payload.new as Record<string, unknown>)?.lead_id === leadId) {
            loadLeadDetails(leadId)
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadLeads, loadLeadDetails])

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead)
    loadLeadDetails(lead.id)
  }

  const atendimentoLeads = leads.filter((l) => l.ia_ativa === false)
  const iaLeads = leads.filter((l) => l.ia_ativa !== false)

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 bg-[#0B0F19] rounded-lg overflow-hidden">
      <InboxList
        title="Atendimento"
        variant="atendimento"
        leads={atendimentoLeads}
        selectedLeadId={selectedLead?.id || null}
        onSelectLead={handleSelectLead}
        loading={loading}
      />
      <InboxList
        title="KMZERO.IA"
        variant="ia"
        leads={iaLeads}
        selectedLeadId={selectedLead?.id || null}
        onSelectLead={handleSelectLead}
        loading={loading}
      />
      <div className="flex-1 flex min-w-0">
        <ActiveChat lead={selectedLead} interactions={interactions} />
        <LeadPanel
          lead={selectedLead}
          notes={notes}
          onNotesChange={() => selectedLead && loadLeadDetails(selectedLead.id)}
        />
      </div>
    </div>
  )
}
