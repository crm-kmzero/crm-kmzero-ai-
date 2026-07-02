import { useEffect, useState, useCallback } from 'react'
import { Shield, Building, Banknote, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard } from '@/components/produtos/product-card'
import { ProductFormDialog } from '@/components/produtos/product-form-dialog'
import { fetchKnowledgeDocs, saveKnowledgeDoc, deleteKnowledgeDoc } from '@/services/knowledge-base'
import type { KnowledgeDoc } from '@/services/knowledge-base'
import { toast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const sections = [
  { key: 'seguros', label: 'Seguros', icon: Shield },
  { key: 'consorcios', label: 'Consórcios', icon: Building },
  { key: 'financiamentos', label: 'Financiamentos', icon: Banknote },
]

export default function Produtos() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogCategoria, setDialogCategoria] = useState('seguros')
  const [editingDoc, setEditingDoc] = useState<KnowledgeDoc | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadDocs = useCallback(async () => {
    const { data } = await fetchKnowledgeDocs()
    if (data) setDocs(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadDocs()
  }, [loadDocs])

  const handleAdd = (categoria: string) => {
    setEditingDoc(null)
    setDialogCategoria(categoria)
    setDialogOpen(true)
  }

  const handleEdit = (doc: KnowledgeDoc) => {
    setEditingDoc(doc)
    setDialogCategoria(doc.categoria || 'seguros')
    setDialogOpen(true)
  }

  const handleSave = async (doc: Partial<KnowledgeDoc>) => {
    const { error } = await saveKnowledgeDoc(doc)
    if (error) {
      toast({ title: 'Erro ao salvar', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: 'Produto salvo com sucesso!' })
      loadDocs()
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await deleteKnowledgeDoc(deleteId)
    if (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    } else {
      toast({ title: 'Produto excluído' })
      loadDocs()
    }
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Base de Conhecimento</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gerencie os produtos e documentação técnica usados pela IA Ana nas conversas.
        </p>
      </div>

      {sections.map((section) => {
        const sectionDocs = docs.filter((d) => d.categoria === section.key)
        return (
          <Card key={section.key} className="border-slate-200">
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <section.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{section.label}</CardTitle>
              </div>
              <Button size="sm" onClick={() => handleAdd(section.key)}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </div>
              ) : sectionDocs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  Nenhum produto cadastrado nesta seção
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sectionDocs.map((doc) => (
                    <ProductCard
                      key={doc.id}
                      doc={doc}
                      onEdit={() => handleEdit(doc)}
                      onDelete={() => setDeleteId(doc.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categoria={dialogCategoria}
        editingDoc={editingDoc}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será removido da base de conhecimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
