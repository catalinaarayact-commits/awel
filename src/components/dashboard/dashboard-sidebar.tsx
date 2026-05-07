'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/actions/auth'
import { Logo } from '@/components/brand/logo'
import { cn } from '@/lib/utils'
import {
  Palette,
  CalendarDays,
  Users,
  Scissors,
  BarChart2,
  Clock,
  LogOut,
  Settings,
  CloudRain,
} from 'lucide-react'

const navItems = [
  { label: 'Mi Agenda',        href: '/dashboard',                  icon: CalendarDays, exact: true  },
  { label: 'Servicios',        href: '/dashboard/servicios',        icon: Scissors,     exact: false },
  { label: 'Horarios',         href: '/dashboard/horarios',         icon: Clock,        exact: false },
  { label: 'Personalización',  href: '/dashboard/personalizacion',  icon: Palette,      exact: false },
  { label: 'Clientes',         href: '/dashboard/clientes',         icon: Users,        exact: false },
  { label: 'Campañas',         href: '/dashboard/campanas',         icon: CloudRain,    exact: false },
  { label: 'Estadísticas',     href: '/dashboard/estadisticas',     icon: BarChart2,    exact: false, soon: true },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-brand-oat-dark bg-white">

      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-brand-oat-dark">
        <Logo markSize={26} textVariant="purple" />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2.5 py-4 overflow-y-auto">
        <p className="px-2 pb-2 text-[10px] font-sans font-medium uppercase tracking-widest text-brand-ink-light">
          Mi negocio
        </p>

        {navItems.map(({ label, href, icon: Icon, exact, soon }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={soon ? '#' : href}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-brand-purple-soft text-brand-purple font-medium'
                  : soon
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-brand-ink-light hover:bg-brand-oat hover:text-brand-ink'
              )}
              onClick={soon ? e => e.preventDefault() : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {soon && (
                <span className="ml-auto text-[9px] font-sans font-medium uppercase tracking-widest text-slate-300">
                  Pronto
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-brand-oat-dark px-2.5 py-4 space-y-0.5">
        <Link
          href="/dashboard/configuracion"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-brand-ink-light hover:bg-brand-oat hover:text-brand-ink transition-colors"
        >
          <Settings className="h-4 w-4 shrink-0" />
          Configuración
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-brand-ink-light hover:bg-brand-oat hover:text-brand-ink transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
