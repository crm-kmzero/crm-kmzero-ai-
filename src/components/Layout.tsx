import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { Skeleton } from '@/components/ui/skeleton'

export default function Layout() {
  const location = useLocation()
  const { user, loading } = useAuth()
  const isPublic = location.pathname === '/' || location.pathname === '/login'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    )
  }

  if (!isPublic && !user) {
    return <Navigate to="/login" replace />
  }

  if (isPublic) {
    return (
      <main className="min-h-screen flex flex-col font-sans">
        <Outlet />
      </main>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-[#F0F2F5] text-slate-900 font-sans">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="mx-auto max-w-7xl animate-fade-in-up">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
