import { useEffect, useState, useCallback } from 'react'
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
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('auto')
  const [search, setSearch] = useState('')

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
    loadLeads()
    const channel = supabase
      .channel('conversador-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => loadLeads())
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interacoes_sdr' },
        (payload) => {
          if (
            selectedLead &&
            (payload.new as Record<string, unknown>)?.lead_id === selectedLead.id
          ) {
            loadLeadDetails(selectedLead.id)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notas_internas' },
        (payload) => {
          if (
            selectedLead &&
            (payload.new as Record<string, unknown>)?.lead_id === selectedLead.id
          ) {
            loadLeadDetails(selectedLead.id)
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadLeads, loadLeadDetails, selectedLead])

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead)
    loadLeadDetails(lead.id)
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesTab = activeTab === 'manual' ? lead.ia_ativa === false : lead.ia_ativa !== false
    const matchesSearch =
      !search ||
      lead.nome.toLowerCase().includes(search.toLowerCase()) ||
      lead.telefone.includes(search) ||
      (lead.produto_interesse || '').toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-0 bg-[#0B0F19]">
      <InboxList
        leads={filteredLeads}
        selectedLeadId={selectedLead?.id || null}
        onSelectLead={handleSelectLead}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
      />
      <ActiveChat lead={selectedLead} interactions={interactions} />
      <LeadPanel
        lead={selectedLead}
        notes={notes}
        onNotesChange={() => selectedLead && loadLeadDetails(selectedLead.id)}
      />
    </div>
  )
}
