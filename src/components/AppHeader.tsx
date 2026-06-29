import { Link } from 'react-router-dom'
import { Search, User, LogOut, Bell } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function AppHeader() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-md transition-colors" />
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar leads pelo nome ou telefone..."
            className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-primary h-10"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-colors"
            >
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 text-primary font-bold">
                AD
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Adriana Gerente</p>
                <p className="text-xs leading-none text-muted-foreground">adriana@kmzero.com.br</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/settings">
                <User className="mr-2 h-4 w-4" /> Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Link to="/login">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
