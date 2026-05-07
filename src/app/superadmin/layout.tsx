import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarNav } from '@/components/superadmin/sidebar-nav'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rol } = await supabase
    .from('roles_usuario')
    .select('role')
    .eq('id', user.id)
    .single()

  if (rol?.role !== 'superadmin') redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
