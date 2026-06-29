import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, UserSquare, Settings, ShieldCheck } from 'lucide-react'
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

export function AppSidebar() {
  const location = useLocation()

  const items = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: Users },
    { name: 'Vendedores', path: '/sellers', icon: UserSquare },
    { name: 'Configurações', path: '/settings', icon: Settings },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-primary font-bold text-xl hover:opacity-90 transition-opacity"
        >
          <ShieldCheck className="h-6 w-6" />
          <span>Km Zero</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="mt-4 gap-2 px-2">
              {items.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} className="text-sm font-medium">
                      <Link to={item.path} className="flex items-center gap-3 px-3 py-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
