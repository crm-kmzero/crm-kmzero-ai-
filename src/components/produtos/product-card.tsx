import { FileText, Pencil, Trash2, ImageIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { KnowledgeDoc } from '@/services/knowledge-base'

interface ProductCardProps {
  doc: KnowledgeDoc
  onEdit: () => void
  onDelete: () => void
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

export function ProductCard({ doc, onEdit, onDelete }: ProductCardProps) {
  const preview = stripHtml(doc.conteudo || '').slice(0, 120)

  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow group">
      {doc.imagem_url && (
        <div className="relative h-32 overflow-hidden rounded-t-lg bg-slate-100">
          <img src={doc.imagem_url} alt={doc.titulo || ''} className="h-full w-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-slate-900">{doc.titulo || 'Sem título'}</CardTitle>
        {doc.subtitulo && <CardDescription className="text-xs">{doc.subtitulo}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2">
        {preview && <p className="text-xs text-slate-500 line-clamp-2">{preview}</p>}
        {doc.arquivo_url && (
          <a
            href={doc.arquivo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
          >
            <FileText className="h-3 w-3" />
            {doc.arquivo_nome || 'Ver documento'}
          </a>
        )}
        <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onEdit}>
            <Pencil className="h-3 w-3 mr-1" /> Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-red-600 hover:text-red-700"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
