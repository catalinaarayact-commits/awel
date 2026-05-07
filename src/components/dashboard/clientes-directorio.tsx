'use client'

import { useState, useMemo, useTransition } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search, Mail, Phone, Calendar, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { getClienteCitas } from '@/actions/dashboard'
import type { ClienteConStats, CitaDelCliente, EstadoCita } from '@/types/database'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatFechaCorta(iso: string) {
  return format(new Date(iso), "d MMM yyyy", { locale: es })
}

function formatFechaLarga(iso: string) {
  return format(new Date(iso), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })
}

// ─── Avatar de iniciales ──────────────────────────────────────────────────────

function AvatarIniciales({ nombre, size = 'sm' }: { nombre: string; size?: 'sm' | 'lg' }) {
  return (
    <div className={cn(
      'rounded-full bg-brand-purple-soft flex items-center justify-center shrink-0 font-sans font-semibold text-brand-purple',
      size === 'sm' ? 'h-8 w-8 text-xs' : 'h-14 w-14 text-lg'
    )}>
      {getInitials(nombre)}
    </div>
  )
}

// ─── Badge de estado ──────────────────────────────────────────────────────────

const ESTADO_STYLES: Record<EstadoCita, string> = {
  pendiente:  'bg-amber-50  text-amber-600',
  confirmada: 'bg-sky-50    text-sky-600',
  completada: 'bg-emerald-50 text-emerald-600',
  cancelada:  'bg-slate-100 text-slate-400',
}
const ESTADO_LABELS: Record<EstadoCita, string> = {
  pendiente:  'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada:  'Cancelada',
}

function EstadoBadge({ estado }: { estado: EstadoCita }) {
  return (
    <span className={cn(
      'shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-widest',
      ESTADO_STYLES[estado]
    )}>
      {ESTADO_LABELS[estado]}
    </span>
  )
}

// ─── Panel lateral — perfil del cliente ───────────────────────────────────────

function ClienteProfile({
  cliente,
  citas,
  loading,
}: {
  cliente: ClienteConStats
  citas: CitaDelCliente[]
  loading: boolean
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* Cabecera */}
      <div className="px-6 pt-10 pb-6 border-b border-brand-oat-dark">
        <div className="flex items-start gap-4">
          <AvatarIniciales nombre={cliente.nombre} size="lg" />
          <div className="min-w-0">
            <SheetTitle className="font-serif text-2xl text-brand-ink leading-tight">
              {cliente.nombre}
            </SheetTitle>
            <p className="mt-1 font-sans text-xs text-brand-ink-light">
              Cliente desde {format(new Date(cliente.created_at), "MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="px-6 py-5 border-b border-brand-oat-dark space-y-3">
        <p className="font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">
          Contacto
        </p>
        {cliente.email && (
          <div className="flex items-center gap-2.5">
            <Mail className="h-3.5 w-3.5 shrink-0 text-brand-ink-light" />
            <span className="font-sans text-sm text-brand-ink break-all">{cliente.email}</span>
          </div>
        )}
        {cliente.telefono && (
          <div className="flex items-center gap-2.5">
            <Phone className="h-3.5 w-3.5 shrink-0 text-brand-ink-light" />
            <span className="font-sans text-sm text-brand-ink">{cliente.telefono}</span>
          </div>
        )}
        {!cliente.email && !cliente.telefono && (
          <p className="font-sans text-sm text-brand-ink-light">Sin datos de contacto.</p>
        )}
      </div>

      {/* Historial de citas */}
      <div className="px-6 py-5 flex-1">
        <p className="font-sans text-[10px] uppercase tracking-widest text-brand-ink-light mb-4">
          Historial de citas{!loading && citas.length > 0 && ` (${citas.length})`}
        </p>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-brand-oat animate-pulse" />
            ))}
          </div>
        ) : citas.length === 0 ? (
          <p className="font-sans text-sm text-brand-ink-light">Sin citas registradas.</p>
        ) : (
          <div className="space-y-2">
            {citas.map(c => (
              <div
                key={c.id}
                className="rounded-xl border border-brand-oat-dark bg-white px-4 py-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-sans text-sm font-medium text-brand-ink">
                    {c.servicio.nombre}
                  </span>
                  <EstadoBadge estado={c.estado} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 shrink-0 text-brand-ink-light" />
                  <p className="font-sans text-xs text-brand-ink-light capitalize">
                    {formatFechaLarga(c.fecha_hora_inicio)}
                  </p>
                </div>
                <p className="font-sans text-[10px] text-brand-ink-light">
                  Duración: {c.servicio.duracion_minutos} min
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Directorio principal ─────────────────────────────────────────────────────

export function ClientesDirectorio({ clientes: initial }: { clientes: ClienteConStats[] }) {
  const [query, setQuery]       = useState('')
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState<ClienteConStats | null>(null)
  const [citas, setCitas]       = useState<CitaDelCliente[]>([])
  const [loadingCitas, startLoad] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return initial
    return initial.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.rut?.toLowerCase().includes(q)
    )
  }, [initial, query])

  function openPerfil(cliente: ClienteConStats) {
    setSelected(cliente)
    setCitas([])
    setOpen(true)
    startLoad(async () => {
      const data = await getClienteCitas(cliente.id)
      setCitas(data)
    })
  }

  return (
    <div className="space-y-4">

      {/* Barra de búsqueda */}
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink-light" />
        <Input
          placeholder="Buscar por nombre, email o RUT..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-slate-100 hover:bg-transparent">
              <TableHead className="px-5 font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">
                Cliente
              </TableHead>
              <TableHead className="font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">
                Contacto
              </TableHead>
              <TableHead className="hidden sm:table-cell font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">
                Última cita
              </TableHead>
              <TableHead className="pr-5 text-right font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">
                Citas
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-14 text-center font-sans text-sm text-brand-ink-light">
                  {query
                    ? 'No se encontraron clientes con esa búsqueda.'
                    : 'Aún no tienes clientes registrados. Cuando alguien reserve en tu página pública, aparecerá aquí.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(c => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-brand-oat/50 transition-colors"
                  onClick={() => openPerfil(c)}
                >
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <AvatarIniciales nombre={c.nombre} />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-sans font-medium text-brand-ink">{c.nombre}</span>
                        {c.churnRisk && (
                          <span className="inline-flex items-center gap-1 font-sans text-[10px] font-medium uppercase tracking-wider text-amber-600">
                            <AlertCircle className="h-3 w-3" />
                            Sin visitar
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3">
                    <div className="flex flex-col gap-0.5">
                      {c.email    && <span className="font-sans text-sm text-brand-ink-light">{c.email}</span>}
                      {c.telefono && <span className="font-sans text-xs text-brand-ink-light">{c.telefono}</span>}
                    </div>
                  </TableCell>

                  <TableCell className="hidden sm:table-cell py-3 font-sans text-sm text-brand-ink-light">
                    {c.ultimaCita ? formatFechaCorta(c.ultimaCita) : '—'}
                  </TableCell>

                  <TableCell className="pr-5 py-3 text-right">
                    <span className={cn(
                      'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 font-sans text-xs font-medium',
                      c.totalCitas > 0
                        ? 'bg-brand-purple-soft text-brand-purple'
                        : 'bg-slate-100 text-slate-400'
                    )}>
                      {c.totalCitas}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sheet / panel lateral */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          showCloseButton
          className="bg-[#FEF8F0] border-l border-brand-oat-dark p-0 sm:max-w-md overflow-hidden"
        >
          {selected && (
            <ClienteProfile
              key={selected.id}
              cliente={selected}
              citas={citas}
              loading={loadingCitas}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
