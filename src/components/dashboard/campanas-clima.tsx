'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CloudRain, Thermometer, MapPin, Save, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { guardarConfigClimaAction, type ConfigClima } from '@/actions/dashboard'
import type { CampanaClima, TipoClima } from '@/types/database'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_META: Record<TipoClima, { label: string; descripcion: string; color: string; bg: string; icon: typeof CloudRain }> = {
  lluvia: {
    label:      'Campaña de lluvia',
    descripcion: 'Se envía cuando llueve o hay llovizna en tu ciudad.',
    color:      'text-blue-600',
    bg:         'bg-blue-50 border-blue-200',
    icon:       CloudRain,
  },
  calor: {
    label:      'Campaña de calor',
    descripcion: 'Se envía cuando la temperatura supera 28 °C.',
    color:      'text-amber-600',
    bg:         'bg-amber-50 border-amber-200',
    icon:       Thermometer,
  },
}

function formatFecha(iso: string) {
  return format(new Date(iso), "d MMM yyyy 'a las' HH:mm", { locale: es })
}

// ─── Toggle card de campaña ────────────────────────────────────────────────────

function CampanaCard({
  tipo,
  activa,
  onToggle,
  disabled,
}: {
  tipo: TipoClima
  activa: boolean
  onToggle: (v: boolean) => void
  disabled: boolean
}) {
  const meta = TIPO_META[tipo]
  const Icon = meta.icon

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(!activa)}
      className={cn(
        'w-full text-left rounded-2xl border-2 p-5 transition-all',
        activa
          ? `${meta.bg} border-current ${meta.color}`
          : 'bg-white border-slate-100 text-brand-ink-light hover:border-slate-200'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            activa ? 'bg-white/60' : 'bg-slate-100'
          )}>
            <Icon className={cn('h-5 w-5', activa ? meta.color : 'text-slate-400')} />
          </div>
          <div>
            <p className={cn('font-sans text-sm font-semibold', activa ? meta.color : 'text-brand-ink')}>
              {meta.label}
            </p>
            <p className="mt-0.5 font-sans text-xs text-brand-ink-light leading-relaxed">
              {meta.descripcion}
            </p>
          </div>
        </div>
        {/* Toggle pill */}
        <div className={cn(
          'shrink-0 h-5 w-9 rounded-full transition-colors relative',
          activa ? 'bg-current' : 'bg-slate-200'
        )}>
          <div className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
            activa ? 'left-4' : 'left-0.5'
          )} />
        </div>
      </div>
    </button>
  )
}

// ─── Fila de historial ────────────────────────────────────────────────────────

function HistorialRow({ campana }: { campana: CampanaClima }) {
  const meta = TIPO_META[campana.tipo_clima]
  const Icon = meta.icon

  return (
    <div className="flex items-center gap-3 py-3 border-b border-brand-oat-dark last:border-0">
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', meta.bg)}>
        <Icon className={cn('h-4 w-4', meta.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm font-medium text-brand-ink capitalize">
          {campana.tipo_clima === 'lluvia' ? 'Campaña de lluvia' : `Campaña de calor${campana.temp_c ? ` · ${campana.temp_c} °C` : ''}`}
        </p>
        <p className="font-sans text-xs text-brand-ink-light">
          {formatFecha(campana.enviada_at)} · {campana.ciudad}
        </p>
      </div>
      <span className="shrink-0 font-sans text-xs font-medium text-brand-ink-light">
        {campana.clientes_notificados} clientes
      </span>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CampanasClima({
  configInicial,
  historial,
}: {
  configInicial: ConfigClima
  historial: CampanaClima[]
}) {
  const [ciudad,   setCiudad]   = useState(configInicial.ciudad ?? '')
  const [lluvia,   setLluvia]   = useState(configInicial.campana_lluvia_activa)
  const [calor,    setCalor]    = useState(configInicial.campana_calor_activa)
  const [error,    setError]    = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [pending,  startSave]   = useTransition()

  function handleGuardar() {
    setError(null)
    setGuardado(false)

    if ((lluvia || calor) && !ciudad.trim()) {
      setError('Ingresa la ciudad para activar las campañas.')
      return
    }

    startSave(async () => {
      const res = await guardarConfigClimaAction({
        ciudad: ciudad.trim() || null,
        campana_lluvia_activa: lluvia,
        campana_calor_activa: calor,
      })
      if (!res.ok) {
        setError(res.error ?? 'Error al guardar.')
      } else {
        setGuardado(true)
        setTimeout(() => setGuardado(false), 3000)
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Ciudad */}
      <section className="rounded-2xl border border-brand-oat-dark bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand-purple" />
          <h2 className="font-serif text-lg text-brand-ink">Tu ciudad</h2>
        </div>
        <p className="mb-4 font-sans text-sm text-brand-ink-light leading-relaxed">
          Ingresa el nombre de tu ciudad en inglés, seguido del código de país (ej.{' '}
          <code className="rounded bg-brand-oat px-1.5 py-0.5 font-mono text-xs text-brand-ink">Santiago,CL</code>
          {' '}o{' '}
          <code className="rounded bg-brand-oat px-1.5 py-0.5 font-mono text-xs text-brand-ink">Valparaiso,CL</code>
          ). Usamos OpenWeatherMap para consultar el clima cada mañana.
        </p>
        <Input
          placeholder="Santiago,CL"
          value={ciudad}
          onChange={e => setCiudad(e.target.value)}
          className="max-w-sm rounded-xl"
        />
      </section>

      {/* Campañas */}
      <section className="rounded-2xl border border-brand-oat-dark bg-white p-6">
        <h2 className="mb-1 font-serif text-lg text-brand-ink">Campañas automáticas</h2>
        <p className="mb-5 font-sans text-sm text-brand-ink-light">
          Cuando se cumpla la condición del clima, tus clientes recibirán un email con un llamado a reservar.
          Se respeta un cooldown de 7 días entre campañas del mismo tipo.
        </p>
        <div className="space-y-3">
          <CampanaCard tipo="lluvia" activa={lluvia} onToggle={setLluvia} disabled={pending} />
          <CampanaCard tipo="calor"  activa={calor}  onToggle={setCalor}  disabled={pending} />
        </div>
      </section>

      {/* Botón guardar + feedback */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleGuardar}
          disabled={pending}
          className="gap-2 rounded-xl bg-brand-purple px-5 py-2.5 text-white hover:opacity-90"
        >
          <Save className="h-4 w-4" />
          {pending ? 'Guardando…' : 'Guardar configuración'}
        </Button>

        {guardado && (
          <span className="flex items-center gap-1.5 font-sans text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4" /> Guardado
          </span>
        )}

        {error && (
          <span className="flex items-center gap-1.5 font-sans text-sm text-red-500">
            <AlertCircle className="h-4 w-4" /> {error}
          </span>
        )}
      </div>

      {/* Historial */}
      {historial.length > 0 && (
        <section className="rounded-2xl border border-brand-oat-dark bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-ink-light" />
            <h2 className="font-serif text-lg text-brand-ink">Historial de campañas</h2>
          </div>
          <div>
            {historial.map(c => (
              <HistorialRow key={c.id} campana={c} />
            ))}
          </div>
        </section>
      )}

      {historial.length === 0 && (
        <p className="font-sans text-sm text-brand-ink-light text-center py-2">
          Aún no se han enviado campañas de clima. Se ejecutan automáticamente cada mañana.
        </p>
      )}
    </div>
  )
}
