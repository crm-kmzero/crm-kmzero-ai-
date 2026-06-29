import { Link } from 'react-router-dom'
import { Eye, Filter, Download } from 'lucide-react'
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
import { mockLeads } from '@/lib/mock'

const statusColors: Record<string, string> = {
  Novo: 'bg-blue-50 text-blue-700 border-blue-200',
  'Em Atendimento': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Morno: 'bg-orange-50 text-orange-700 border-orange-200',
  Ganho: 'bg-green-50 text-green-700 border-green-200',
  Perdido: 'bg-red-50 text-red-700 border-red-200',
}

export default function Leads() {
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
            <Input placeholder="Buscar por nome ou telefone..." className="max-w-md h-10" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select defaultValue="todos">
              <SelectTrigger className="w-[160px] h-10">
                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="atendimento">Em Atendimento</SelectItem>
                <SelectItem value="ganho">Ganho</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="todos">
              <SelectTrigger className="w-[160px] h-10">
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Produtos</SelectItem>
                <SelectItem value="auto">Seguro Auto</SelectItem>
                <SelectItem value="consorcio">Consórcio</SelectItem>
                <SelectItem value="vida">Seguro de Vida</SelectItem>
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
                <TableHead className="font-semibold text-slate-700">Vendedor</TableHead>
                <TableHead className="font-semibold text-slate-700">Data</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="font-medium text-slate-900">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {lead.name}
                      </Link>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{lead.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-700">{lead.product}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${statusColors[lead.status]} font-medium`}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm font-medium ${lead.seller === 'Não Atribuído' ? 'text-slate-400 italic' : 'text-slate-700'}`}
                    >
                      {lead.seller}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{lead.date}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-500 pt-2">
          <div>Mostrando 1 a 5 de 5 leads</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled>
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
