'use client'

import { useState, useTransition } from 'react'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { actualizarEstadoCitaAction } from '@/actions/dashboard'
import type { CitaConDetalle, EstadoCita } from '@/types/database'
import { cn } from '@/lib/utils'

// ─── Badge de estado ──────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoCita, { label: string; className: string }> = {
  pendiente:  { label: 'Pendiente',  className: 'bg-[#8CA7F4]/20 text-[#3a5abf] border border-[#8CA7F4]/40' },
  confirmada: { label: 'Confirmada', className: 'bg-[#D98CF4]/20 text-[#8a3abf] border border-[#D98CF4]/40' },
  completada: { label: 'Completada', className: 'bg-[#DBF48C]/30 text-[#4a6a00] border border-[#DBF48C]/60' },
  cancelada:  { label: 'Cancelada',  className: 'bg-slate-100 text-slate-400 border border-slate-200'        },
}

function EstadoBadge({ estado }: { estado: EstadoCita }) {
  const { label, className } = ESTADO_CONFIG[estado]
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-[10px] font-medium uppercase tracking-widest',
      className
    )}>
      {label}
    </span>
  )
}

// ─── Formato de fecha ─────────────────────────────────────────────────────────

function formatFechaHora(iso: string): { fecha: string; hora: string } {
  const date = parseISO(iso)
  let fecha: string
  if (isToday(date))    fecha = 'Hoy'
  else if (isTomorrow(date)) fecha = 'Mañana'
  else fecha = format(date, "EEE d 'de' MMM", { locale: es })

  const hora = format(date, 'HH:mm', { locale: es })
  return { fecha: fecha.charAt(0).toUpperCase() + fecha.slice(1), hora }
}

// ─── Fila de cita con selector de estado ─────────────────────────────────────

function CitaRow({ cita: initialCita }: { cita: CitaConDetalle }) {
  const [cita, setCita] = useState(initialCita)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { fecha, hora } = formatFechaHora(cita.fecha_hora_inicio)

  function handleEstadoChange(nuevoEstado: string | null) {
    if (!nuevoEstado || nuevoEstado === cita.estado) return
    const estadoAnterior = cita.estado
    setCita(c => ({ ...c, estado: nuevoEstado as EstadoCita })) // optimistic
    setError(null)
    startTransition(async () => {
      const result = await actualizarEstadoCitaAction(cita.id, nuevoEstado as EstadoCita)
      if (!result.ok) {
        setCita(c => ({ ...c, estado: estadoAnterior })) // revert
        setError(result.error ?? 'Error')
      }
    })
  }

  return (
    <TableRow className={cn(
      'transition-colors',
      cita.estado === 'cancelada' && 'opacity-50',
      isPending && 'opacity-70'
    )}>
      {/* Cliente */}
      <TableCell className="py-3 pl-5">
        <p className="font-sans font-medium text-brand-ink text-sm">{cita.cliente.nombre}</p>
        <p className="font-sans text-xs text-brand-ink-light mt-0.5">
          {cita.cliente.telefono ?? cita.cliente.email ?? '—'}
        </p>
      </TableCell>

      {/* Servicio */}
      <TableCell className="py-3">
        <p className="font-sans text-sm text-brand-ink">{cita.servicio.nombre}</p>
        <p className="font-sans text-xs text-brand-ink-light">{cita.servicio.duracion_minutos} min</p>
      </TableCell>

      {/* Fecha y hora */}
      <TableCell className="py-3">
        <p className="font-sans text-sm font-medium text-brand-ink">{fecha}</p>
        <p className="font-sans text-xs text-brand-ink-light">{hora}</p>
      </TableCell>

      {/* Estado */}
      <TableCell className="py-3">
        <EstadoBadge estado={cita.estado} />
      </TableCell>

      {/* Acciones */}
      <TableCell className="py-3 pr-5">
        <div className="flex flex-col gap-1">
          <Select value={cita.estado} onValueChange={handleEstadoChange}>
            <SelectTrigger size="sm" className="w-36 rounded-xl text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="confirmada">Confirmada</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          {error && <p className="text-[10px] text-red-500">{error}</p>}
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── Filtro de estado ─────────────────────────────────────────────────────────

type Filtro = 'todas' | EstadoCita

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'todas',      label: 'Todas'     },
  { value: 'pendiente',  label: 'Pendientes' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'completada', label: 'Completadas' },
  { value: 'cancelada',  label: 'Canceladas' },
]

// ─── Tabla principal ──────────────────────────────────────────────────────────

export function AgendaTable({ citas }: { citas: CitaConDetalle[] }) {
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const citasFiltradas = filtro === 'todas'
    ? citas
    : citas.filter(c => c.estado === filtro)

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">

      {/* Header de la tabla */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-sans text-sm text-brand-ink-light">
          {citasFiltradas.length} {citasFiltradas.length === 1 ? 'cita' : 'citas'}
          {filtro !== 'todas' && ` · ${FILTROS.find(f => f.value === filtro)?.label.toLowerCase()}`}
        </p>

        {/* Filtro pills */}
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={cn(
                'rounded-full px-3 py-1 font-sans text-xs transition-colors',
                filtro === f.value
                  ? 'bg-brand-ink text-white'
                  : 'bg-brand-oat text-brand-ink-light hover:bg-brand-oat-dark'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {citasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <p className="font-serif text-lg text-brand-ink-light">Sin citas</p>
          <p className="font-sans text-sm text-brand-ink-light max-w-xs">
            {filtro === 'todas'
              ? 'Cuando tus clientes reserven desde tu página pública aparecerán aquí.'
              : 'No hay citas con este estado.'}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-b-slate-100 hover:bg-transparent">
              <TableHead className="pl-5 font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">Cliente</TableHead>
              <TableHead className="font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">Servicio</TableHead>
              <TableHead className="font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">Fecha / Hora</TableHead>
              <TableHead className="font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">Estado</TableHead>
              <TableHead className="pr-5 font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">Cambiar estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {citasFiltradas.map(cita => (
              <CitaRow key={cita.id} cita={cita} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
