import { useEffect, useState, useCallback } from 'react'
import { UserPlus, Mail, Trash2, Loader2, Shield, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { fetchProfiles, inviteMember, deleteProfile, Profile } from '@/services/team'
import { toast } from '@/hooks/use-toast'

export default function Team() {
  const { isAdminMaster } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('broker')

  const load = useCallback(async () => {
    const { data } = await fetchProfiles()
    if (data) setProfiles(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!isAdminMaster) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="h-12 w-12 text-slate-300" />
        <p className="text-slate-500 font-medium">Acesso restrito a administradores.</p>
      </div>
    )
  }

  const handleInvite = async () => {
    setInviting(true)
    const { error } = await inviteMember(email, name, role)
    setInviting(false)
    if (error) {
      toast({ title: 'Erro ao convidar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Convite enviado!', description: `${name} foi convidado para a equipe.` })
      setEmail('')
      setName('')
      setRole('broker')
      setDialogOpen(false)
      load()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteProfile(id)
    if (error) {
      toast({ title: 'Erro ao remover membro', variant: 'destructive' })
    } else {
      toast({ title: 'Membro removido da equipe' })
      load()
    }
  }

  const getInitials = (n: string) =>
    n
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Equipe</h1>
          <p className="text-slate-500 mt-1">Convide e gerencie membros da equipe e corretores.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <UserPlus className="mr-2 h-4 w-4" /> Convidar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Convidar Novo Membro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="João da Silva"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Corporativo</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="joao@kmzero.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broker">Corretor</SelectItem>
                    <SelectItem value="admin-master">Administrador Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleInvite}
                  disabled={inviting || !email || !name}
                  className="w-full"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    'Enviar Convite'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="h-32 animate-pulse bg-slate-100 rounded-lg" />
            </Card>
          ))
        ) : profiles.length === 0 ? (
          <Card className="col-span-full border-dashed border-slate-300">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
              <UserCog className="h-10 w-10 text-slate-300" />
              <p className="text-slate-500 font-medium">Nenhum membro cadastrado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          profiles.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-all border-slate-200">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                      {getInitials(p.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" /> {p.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    p.role === 'admin-master'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }
                >
                  {p.role === 'admin-master' ? 'Admin Master' : 'Corretor'}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    p.status === 'active'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }
                >
                  {p.status === 'active' ? 'Ativo' : 'Convidado'}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
