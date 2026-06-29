import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ShieldCheck, TrendingUp, Users } from 'lucide-react'

export default function Index() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <header className="h-20 border-b flex items-center justify-between px-6 md:px-12 bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 text-primary font-bold text-2xl tracking-tight">
          <ShieldCheck className="h-8 w-8" />
          <span>Km Zero CRM</span>
        </div>
        <Button asChild size="lg" className="font-semibold shadow-md">
          <Link to="/login">Acessar CRM</Link>
        </Button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
            A plataforma definitiva para gestão de{' '}
            <span className="text-primary">seguros e consórcios</span>.
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto font-medium">
            Centralize seus leads, automatize o atendimento via WhatsApp com nossa IA "Ana" e
            potencialize as vendas da corretora.
          </p>
          <div className="pt-8">
            <Button
              size="lg"
              className="text-lg h-14 px-10 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              asChild
            >
              <Link to="/login">Entrar no Sistema</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-4xl font-black mb-2 text-slate-900">20+</h3>
            <p className="text-lg font-medium text-slate-500">Anos de Mercado</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-4xl font-black mb-2 text-slate-900">10k+</h3>
            <p className="text-lg font-medium text-slate-500">Clientes Satisfeitos</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
              <TrendingUp className="h-8 w-8" />
            </div>
            <h3 className="text-4xl font-black mb-2 text-slate-900">R$ 50M</h3>
            <p className="text-lg font-medium text-slate-500">Em Consórcios</p>
          </div>
        </div>
      </main>
    </div>
  )
}
