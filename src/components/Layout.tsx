import { Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'

export default function Layout() {
  const location = useLocation()
  const isPublic = location.pathname === '/' || location.pathname === '/login'

  if (isPublic) {
    return (
      <main className="min-h-screen flex flex-col font-sans">
        <Outlet />
      </main>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-slate-50/40 text-slate-900 font-sans">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            <div className="mx-auto max-w-7xl animate-fade-in-up">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
