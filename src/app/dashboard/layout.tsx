import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rol } = await supabase
    .from('roles_usuario')
    .select('role')
    .eq('id', user.id)
    .single()

  if (rol?.role !== 'admin_negocio') redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_negocio')
    .select('estado_cuenta')
    .eq('user_id', user.id)
    .single()

  if (perfil?.estado_cuenta === 'suspendido') redirect('/dashboard/inactivo')

  return (
    <div className="flex h-screen overflow-hidden bg-brand-oat">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
