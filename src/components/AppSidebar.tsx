import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  UserSquare,
  BarChart3,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { UserCog } from 'lucide-react'

export function AppSidebar() {
  const location = useLocation()
  const { isAdminMaster } = useAuth()

  const items = [
    { name: 'Painel', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: Users },
    { name: 'Produtos', path: '/produtos', icon: Package },
    { name: 'Vendedores', path: '/sellers', icon: UserSquare },
    { name: 'Relatórios', path: '/relatorios', icon: BarChart3 },
    { name: 'Configurações', path: '/settings', icon: Settings },
  ]

  const adminItems = [{ name: 'Equipe', path: '/team', icon: UserCog }]

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-primary font-bold text-xl hover:opacity-90 transition-opacity"
        >
          <ShieldCheck className="h-6 w-6" />
          <span>KMZERO.AI</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="mt-4 gap-1 px-2">
              {items.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        to={item.path}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                          isActive
                            ? 'bg-[#EBF5FF] text-[#0066FF] border-l-2 border-[#0066FF]'
                            : 'text-[#6B7280] hover:bg-slate-50',
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
            {isAdminMaster && (
              <SidebarMenu className="mt-2 gap-1 px-2 pt-3 border-t border-slate-100">
                <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Administração
                </p>
                {adminItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path)
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link
                          to={item.path}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            isActive
                              ? 'bg-[#EBF5FF] text-[#0066FF] border-l-2 border-[#0066FF]'
                              : 'text-[#6B7280] hover:bg-slate-50',
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
