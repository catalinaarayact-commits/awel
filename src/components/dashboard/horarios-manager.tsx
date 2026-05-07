'use client'

import { useState, useTransition, useRef } from 'react'
import { guardarHorariosAction } from '@/actions/dashboard'
import type { HorarioInput } from '@/actions/dashboard'
import type { HorarioAtencion } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Loader2, Check, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Días de la semana (ISO: 1=Lunes, 7=Domingo) ─────────────────────────────

const DIAS = [
  { num: 1, label: 'Lunes',     short: 'Lun' },
  { num: 2, label: 'Martes',    short: 'Mar' },
  { num: 3, label: 'Miércoles', short: 'Mié' },
  { num: 4, label: 'Jueves',    short: 'Jue' },
  { num: 5, label: 'Viernes',   short: 'Vie' },
  { num: 6, label: 'Sábado',    short: 'Sáb' },
  { num: 7, label: 'Domingo',   short: 'Dom' },
]

const DEFAULT_APERTURA = '09:00'
const DEFAULT_CIERRE   = '18:00'

function toHHMM(time: string): string {
  return time.slice(0, 5)
}

function buildInitialState(existentes: HorarioAtencion[]): HorarioInput[] {
  return DIAS.map(({ num }) => {
    const found = existentes.find(h => h.dia_semana === num)
    return {
      dia_semana:        num,
      hora_apertura:     found ? toHHMM(found.hora_apertura) : DEFAULT_APERTURA,
      hora_cierre:       found ? toHHMM(found.hora_cierre)   : DEFAULT_CIERRE,
      activo:            found ? found.activo : false,
      modo:              found?.modo ?? 'rango',
      slots_especificos: found?.slots_especificos ?? null,
    }
  })
}

// ─── Fila de un día ───────────────────────────────────────────────────────────

function DiaRow({
  dia,
  horario,
  onChange,
}: {
  dia: { num: number; label: string; short: string }
  horario: HorarioInput
  onChange: (updated: HorarioInput) => void
}) {
  const timeInputRef = useRef<HTMLInputElement>(null)

  function addSlot(time: string) {
    if (!time) return
    const current = horario.slots_especificos ?? []
    if (current.includes(time)) return
    const sorted = [...current, time].sort()
    onChange({ ...horario, slots_especificos: sorted })
    if (timeInputRef.current) timeInputRef.current.value = ''
  }

  function removeSlot(slot: string) {
    const updated = (horario.slots_especificos ?? []).filter(s => s !== slot)
    onChange({ ...horario, slots_especificos: updated.length > 0 ? updated : null })
  }

  return (
    <div className={cn(
      'rounded-2xl border px-4 py-4 transition-colors',
      horario.activo ? 'border-brand-purple-soft bg-white' : 'border-slate-100 bg-slate-50/60'
    )}>
      {/* Toggle + nombre */}
      <div className="flex items-center gap-3 mb-3">
        <button
          type="button"
          onClick={() => onChange({ ...horario, activo: !horario.activo })}
          className={cn(
            'relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple',
            horario.activo ? 'bg-brand-purple' : 'bg-slate-200'
          )}
          aria-label={`${horario.activo ? 'Desactivar' : 'Activar'} ${dia.label}`}
        >
          <span className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            horario.activo ? 'translate-x-4' : 'translate-x-0.5'
          )} />
        </button>
        <span className={cn(
          'font-sans text-sm font-medium',
          horario.activo ? 'text-brand-ink' : 'text-slate-400'
        )}>
          {dia.label}
        </span>
      </div>

      {/* Controles (sólo si activo) */}
      {horario.activo && (
        <div className="ml-12 space-y-3">

          {/* Selector de modo */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onChange({ ...horario, modo: 'rango' })}
              className={cn(
                'rounded-full px-3 py-1 font-sans text-xs font-medium transition-colors',
                horario.modo === 'rango'
                  ? 'bg-brand-purple text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              Rango de horas
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...horario, modo: 'especifico' })}
              className={cn(
                'rounded-full px-3 py-1 font-sans text-xs font-medium transition-colors',
                horario.modo === 'especifico'
                  ? 'bg-brand-purple text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              Horarios fijos
            </button>
          </div>

          {/* Modo rango */}
          {horario.modo === 'rango' && (
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">Apertura</label>
                <input
                  type="time"
                  value={horario.hora_apertura}
                  onChange={e => onChange({ ...horario, hora_apertura: e.target.value })}
                  className="rounded-xl border border-input bg-background px-3 py-1.5 font-sans text-sm text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
                />
              </div>
              <span className="mt-5 font-sans text-sm text-brand-ink-light">—</span>
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">Cierre</label>
                <input
                  type="time"
                  value={horario.hora_cierre}
                  onChange={e => onChange({ ...horario, hora_cierre: e.target.value })}
                  className="rounded-xl border border-input bg-background px-3 py-1.5 font-sans text-sm text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
                />
              </div>
            </div>
          )}

          {/* Modo específico */}
          {horario.modo === 'especifico' && (
            <div className="space-y-2">
              {/* Pills de slots existentes */}
              <div className="flex flex-wrap gap-2">
                {(horario.slots_especificos ?? []).map(slot => (
                  <span
                    key={slot}
                    className="flex items-center gap-1 rounded-full bg-brand-purple-soft px-3 py-1 font-sans text-xs font-medium text-brand-purple"
                  >
                    {slot}
                    <button
                      type="button"
                      onClick={() => removeSlot(slot)}
                      className="ml-0.5 rounded-full text-brand-purple/60 hover:text-brand-purple focus-visible:outline-none"
                      aria-label={`Eliminar ${slot}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {(!horario.slots_especificos || horario.slots_especificos.length === 0) && (
                  <p className="font-sans text-xs text-slate-400">Sin horarios — agrega al menos uno.</p>
                )}
              </div>

              {/* Input para agregar un slot */}
              <div className="flex items-center gap-2">
                <input
                  ref={timeInputRef}
                  type="time"
                  className="rounded-xl border border-input bg-background px-3 py-1.5 font-sans text-sm text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSlot((e.target as HTMLInputElement).value)
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addSlot(timeInputRef.current?.value ?? '')}
                  className="flex items-center gap-1 rounded-full bg-brand-ink px-3 py-1.5 font-sans text-xs font-medium text-white transition-colors hover:bg-brand-ink/80"
                >
                  <Plus className="h-3 w-3" /> Agregar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Manager principal ────────────────────────────────────────────────────────

export function HorariosManager({ existentes }: { existentes: HorarioAtencion[] }) {
  const [horarios, setHorarios] = useState<HorarioInput[]>(buildInitialState(existentes))
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function updateDia(updated: HorarioInput) {
    setHorarios(prev => prev.map(h => h.dia_semana === updated.dia_semana ? updated : h))
    setSaved(false)
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await guardarHorariosAction(horarios)
      if (result.ok) setSaved(true)
      else setError(result.error ?? 'Error al guardar.')
    })
  }

  const diasActivos = horarios.filter(h => h.activo).length

  return (
    <div className="max-w-2xl space-y-4">
      <p className="font-sans text-sm text-brand-ink-light">
        {diasActivos === 0
          ? 'Sin días activos — los clientes no podrán reservar hasta que configures al menos un día.'
          : `${diasActivos} ${diasActivos === 1 ? 'día activo' : 'días activos'}`}
      </p>

      <div className="space-y-2">
        {DIAS.map(dia => (
          <DiaRow
            key={dia.num}
            dia={dia}
            horario={horarios.find(h => h.dia_semana === dia.num)!}
            onChange={updateDia}
          />
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 font-sans text-xs text-red-600">
          {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2.5 font-sans text-xs text-emerald-600">
          <Check className="h-3.5 w-3.5" /> Horarios guardados correctamente
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={isPending}
        className="w-full rounded-2xl font-sans text-xs uppercase tracking-widest sm:w-auto sm:px-8"
      >
        {isPending ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Guardando...</> : 'Guardar horarios'}
      </Button>
    </div>
  )
}
