import { useState, useEffect } from 'react'
import { Upload, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/produtos/rich-text-editor'
import { uploadProductFile } from '@/services/storage'
import type { KnowledgeDoc } from '@/services/knowledge-base'
import { toast } from '@/hooks/use-toast'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoria: string
  editingDoc: KnowledgeDoc | null
  onSave: (doc: Partial<KnowledgeDoc>) => Promise<void>
}

export function ProductFormDialog({
  open,
  onOpenChange,
  categoria,
  editingDoc,
  onSave,
}: ProductFormDialogProps) {
  const [titulo, setTitulo] = useState('')
  const [subtitulo, setSubtitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [imagemUrl, setImagemUrl] = useState('')
  const [arquivoUrl, setArquivoUrl] = useState('')
  const [arquivoNome, setArquivoNome] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingDoc) {
      setTitulo(editingDoc.titulo || '')
      setSubtitulo(editingDoc.subtitulo || '')
      setConteudo(editingDoc.conteudo || '')
      setImagemUrl(editingDoc.imagem_url || '')
      setArquivoUrl(editingDoc.arquivo_url || '')
      setArquivoNome(editingDoc.arquivo_nome || '')
    } else {
      setTitulo('')
      setSubtitulo('')
      setConteudo('')
      setImagemUrl('')
      setArquivoUrl('')
      setArquivoNome('')
    }
  }, [editingDoc, open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { url, error } = await uploadProductFile(file, 'image')
    if (url) setImagemUrl(url)
    if (error) toast({ title: 'Erro no upload', description: error, variant: 'destructive' })
    setUploading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { url, error } = await uploadProductFile(file, 'document')
    if (url) {
      setArquivoUrl(url)
      setArquivoNome(file.name)
    }
    if (error) toast({ title: 'Erro no upload', description: error, variant: 'destructive' })
    setUploading(false)
  }

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast({ title: 'Título é obrigatório', variant: 'destructive' })
      return
    }
    setSaving(true)
    await onSave({
      id: editingDoc?.id,
      titulo: titulo.trim(),
      subtitulo: subtitulo.trim(),
      conteudo,
      produto: titulo.trim(),
      categoria,
      imagem_url: imagemUrl || null,
      arquivo_url: arquivoUrl || null,
      arquivo_nome: arquivoNome || null,
    })
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingDoc ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Seguro Auto"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Subtítulo</Label>
            <Input
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              placeholder="Ex: Proteção completa"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <RichTextEditor
              value={conteudo}
              onChange={setConteudo}
              placeholder="Descreva o produto..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Imagem</Label>
              {imagemUrl ? (
                <div className="relative h-20 rounded-md overflow-hidden">
                  <img src={imagemUrl} alt="" className="h-full w-full object-cover" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setImagemUrl('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Label className="flex items-center justify-center h-20 border-2 border-dashed rounded-md cursor-pointer hover:bg-slate-50">
                  <Upload className="h-4 w-4 mr-2 text-slate-400" />
                  <span className="text-xs text-slate-400">
                    {uploading ? 'Enviando...' : 'Enviar imagem'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </Label>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Documento (PDF/Manual)</Label>
              {arquivoUrl ? (
                <div className="flex items-center justify-between h-20 px-3 border rounded-md">
                  <span className="text-xs truncate">{arquivoNome}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      setArquivoUrl('')
                      setArquivoNome('')
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Label className="flex items-center justify-center h-20 border-2 border-dashed rounded-md cursor-pointer hover:bg-slate-50">
                  <Upload className="h-4 w-4 mr-2 text-slate-400" />
                  <span className="text-xs text-slate-400">
                    {uploading ? 'Enviando...' : 'Enviar documento'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </Label>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
