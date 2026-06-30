import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Filter, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { fetchLeads } from '@/services/leads'
import type { Lead } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays} dias atrás`
  return date.toLocaleDateString('pt-BR')
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estagioFilter, setEstagioFilter] = useState('todos')
  const [produtoFilter, setProdutoFilter] = useState('todos')

  const loadLeads = useCallback(async () => {
    const { data } = await fetchLeads()
    if (data) setLeads(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadLeads()
    const channel = supabase
      .channel('leads-list-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadLeads()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadLeads])

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !search ||
      lead.nome.toLowerCase().includes(search.toLowerCase()) ||
      lead.telefone.includes(search)
    const matchesEstagio = estagioFilter === 'todos' || lead.estagio === estagioFilter
    const matchesProduto = produtoFilter === 'todos' || lead.produto_interesse === produtoFilter
    return matchesSearch && matchesEstagio && matchesProduto
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Leads</h1>
          <p className="text-slate-500 mt-1">
            Gerencie os contatos captados e distribuídos para os vendedores.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-300">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome ou telefone..."
              className="max-w-md h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={estagioFilter} onValueChange={setEstagioFilter}>
              <SelectTrigger className="w-[180px] h-10">
                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="contato">Contato</SelectItem>
                <SelectItem value="qualificado">Qualificado</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={produtoFilter} onValueChange={setProdutoFilter}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Produtos</SelectItem>
                <SelectItem value="Auto">Seguro Auto</SelectItem>
                <SelectItem value="Consorcio">Consórcio</SelectItem>
                <SelectItem value="Vida">Seguro de Vida</SelectItem>
                <SelectItem value="Residencial">Residencial</SelectItem>
                <SelectItem value="Empresarial">Empresarial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Nome / Contato</TableHead>
                <TableHead className="font-semibold text-slate-700">Produto</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="font-semibold text-slate-700">Data</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {lead.nome}
                        </Link>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{lead.telefone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-700">
                        {lead.produto_interesse || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${estagioColors[lead.estagio || 'novo']} font-medium`}
                      >
                        {estagioLabels[lead.estagio || 'novo']}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(lead.data_criacao)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-primary hover:bg-primary/10"
                        asChild
                      >
                        <Link to={`/leads/${lead.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-500 pt-2">
          <div>
            Mostrando {filteredLeads.length} de {leads.length} leads
          </div>
        </div>
      </div>
    </div>
  )
}
