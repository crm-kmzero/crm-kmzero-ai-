import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signInWithOtp, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    const { error } = await signIn(email, password)
    setIsLoading(false)
    if (error) {
      if (error.message?.includes('Invalid login')) {
        setError('Credenciais inválidas. Verifique seu email e senha.')
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Email não confirmado. Verifique sua caixa de entrada.')
      } else {
        setError(error.message || 'Erro ao fazer login. Tente novamente.')
      }
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Digite seu email para receber o link de acesso.')
      return
    }
    setError(null)
    setSuccess(null)
    setIsMagicLinkLoading(true)
    const { error } = await signInWithOtp(email)
    setIsMagicLinkLoading(false)
    if (error) {
      setError(error.message || 'Erro ao enviar magic link. Tente novamente.')
    } else {
      setSuccess('Verifique seu email para o link de acesso mágico.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <Link
        to="/"
        className="flex items-center gap-2 text-primary font-bold text-3xl tracking-tight mb-10 hover:opacity-90 transition-opacity"
      >
        <ShieldCheck className="h-10 w-10 text-primary" />
        <span>Km Zero CRM</span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-0 animate-fade-in-up">
        <CardHeader className="space-y-2 text-center pb-8 pt-8">
          <CardTitle className="text-2xl font-bold tracking-tight">Acesso ao Sistema</CardTitle>
          <CardDescription className="text-base">
            Faça login para acessar o painel administrativo
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-slate-700">
                Email corporativo
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@kmzero.com.br"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base bg-slate-50 focus-visible:ring-primary pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold text-slate-700">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base bg-slate-50 focus-visible:ring-primary pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-transform"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Autenticando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-medium">
              <span className="bg-white px-3 text-slate-400">Ou continue com</span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full h-12 text-base font-medium border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-transform"
            onClick={handleMagicLink}
            disabled={isMagicLinkLoading}
          >
            {isMagicLinkLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando link...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-5 w-5" />
                Magic Link
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
