'use client'

import { useState, useTransition, type CSSProperties } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO, getISODay, isBefore, startOfToday, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, ChevronLeft, Clock, Banknote, AlertCircle, BellPlus } from 'lucide-react'
import { getHorasDisponibles, crearCitaPublicaAction, unirseListaEsperaAction, getAddonsServicio } from '@/actions/public'
import type { PerfilNegocio, Servicio, ServicioAddon, HorarioAtencion } from '@/types/database'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  negocio: PerfilNegocio
  servicios: Servicio[]
  horarios: HorarioAtencion[]
}

type Step = 'servicio' | 'addons' | 'datetime' | 'datos' | 'confirmacion' | 'exito'

const formSchema = z.object({
  nombre: z.string().min(2, 'Ingresa tu nombre completo'),
  email: z.string().email('Ingresa un email válido'),
  telefono: z.string().optional(),
  notasCliente: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(precio)
}

function formatFecha(fecha: string) {
  return format(parseISO(fecha), "EEEE d 'de' MMMM", { locale: es })
}

// ─── Header con portada ───────────────────────────────────────────────────────

function Header({ negocio }: { negocio: PerfilNegocio }) {
  return (
    <header className="mb-6">
      {/* Portada */}
      {negocio.portada_url ? (
        <div className="relative h-48 w-full overflow-hidden rounded-2xl">
          <Image
            src={negocio.portada_url}
            alt={`Portada de ${negocio.nombre_negocio}`}
            fill
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />

          {/* Logo + nombre sobre la portada */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 text-center">
            {negocio.logo_url && (
              <div className="mb-2 h-14 w-14 overflow-hidden rounded-2xl border-2 border-white/80 shadow-md">
                <Image
                  src={negocio.logo_url}
                  alt={negocio.nombre_negocio}
                  width={56}
                  height={56}
                  className="h-full w-full object-contain bg-white"
                  unoptimized
                />
              </div>
            )}
            <h1 className="font-serif text-2xl tracking-tight text-white drop-shadow-sm">{negocio.nombre_negocio}</h1>
            {negocio.texto_bienvenida && (
              <p className="mt-1 font-sans text-sm text-white/80 max-w-sm drop-shadow-sm">{negocio.texto_bienvenida}</p>
            )}
          </div>
        </div>
      ) : (
        /* Sin portada: header simple */
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          {negocio.logo_url && (
            <Image
              src={negocio.logo_url}
              alt={negocio.nombre_negocio}
              width={72}
              height={72}
              className="h-16 w-auto object-contain"
              unoptimized
            />
          )}
          <h1 className="font-serif text-2xl tracking-tight text-brand-ink">{negocio.nombre_negocio}</h1>
          {negocio.texto_bienvenida && (
            <p className="font-sans text-sm text-brand-ink-light max-w-sm">{negocio.texto_bienvenida}</p>
          )}
        </div>
      )}
    </header>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'servicio',     label: 'Servicio'  },
    { key: 'datetime',     label: 'Fecha'     },
    { key: 'datos',        label: 'Datos'     },
    { key: 'confirmacion', label: 'Confirmar' },
  ]
  const current = steps.findIndex(s => s.key === step)

  return (
    <nav className="mb-6 flex items-center justify-center">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium font-sans transition-colors',
            i < current ? 'bg-primary text-primary-foreground'
              : i === current ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
              : 'bg-muted text-muted-foreground'
          )}>
            {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          <span className={cn(
            'ml-1.5 hidden text-xs font-sans sm:block',
            i === current ? 'text-foreground font-medium' : 'text-muted-foreground'
          )}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={cn('mx-2 h-px w-8 transition-colors', i < current ? 'bg-primary' : 'bg-muted')} />
          )}
        </div>
      ))}
    </nav>
  )
}

// ─── Step 1: Servicio ─────────────────────────────────────────────────────────

function StepServicio({ servicios, onSelect }: { servicios: Servicio[]; onSelect: (s: Servicio) => void }) {
  if (servicios.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="font-sans text-sm text-brand-ink-light">
          Este negocio no tiene servicios disponibles por el momento.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-4 font-serif text-xl text-brand-ink">¿Qué servicio necesitas?</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {servicios.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {/* Foto del servicio */}
            {s.foto_url ? (
              <div className="relative h-32 w-full overflow-hidden">
                <Image
                  src={s.foto_url}
                  alt={s.nombre}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="h-2 w-full transition-all group-hover:h-3"
                style={{ backgroundColor: 'var(--primary)' }}
              />
            )}

            <div className="flex flex-1 items-center justify-between p-4">
              <div className="min-w-0">
                <p className="font-sans font-medium text-brand-ink group-hover:text-primary transition-colors truncate">
                  {s.nombre}
                </p>
                {s.descripcion && (
                  <p className="mt-0.5 font-sans text-xs text-brand-ink-light line-clamp-1">{s.descripcion}</p>
                )}
                <div className="mt-1.5 flex items-center gap-3 text-xs text-brand-ink-light">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.duracion_minutos} min</span>
                  <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />{formatPrecio(s.precio)}</span>
                </div>
              </div>
              <ChevronLeft className="h-5 w-5 rotate-180 shrink-0 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2: Fecha y hora ─────────────────────────────────────────────────────

// ─── Step 1.5: Add-ons ───────────────────────────────────────────────────────

function StepAddons({
  servicio,
  addons,
  seleccionados,
  onChange,
  onContinuar,
  onBack,
}: {
  servicio: Servicio
  addons: ServicioAddon[]
  seleccionados: ServicioAddon[]
  onChange: (addons: ServicioAddon[]) => void
  onContinuar: () => void
  onBack: () => void
}) {
  function toggle(addon: ServicioAddon) {
    const ya = seleccionados.some(a => a.id === addon.id)
    onChange(ya ? seleccionados.filter(a => a.id !== addon.id) : [...seleccionados, addon])
  }

  const extraPrecio  = seleccionados.reduce((s, a) => s + a.precio, 0)
  const extraMinutos = seleccionados.reduce((s, a) => s + a.duracion_minutos, 0)
  const totalPrecio  = servicio.precio + extraPrecio
  const totalMin     = servicio.duracion_minutos + extraMinutos

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 font-sans text-sm text-brand-ink-light hover:text-brand-ink">
        <ChevronLeft className="h-4 w-4" /> Volver
      </button>
      <h2 className="mb-1 font-serif text-xl text-brand-ink">¿Quieres agregar algo más?</h2>
      <p className="mb-5 font-sans text-xs text-brand-ink-light">
        {servicio.nombre} · opcional — puedes continuar sin seleccionar nada
      </p>

      <div className="space-y-2 mb-5">
        {addons.map(addon => {
          const activo = seleccionados.some(a => a.id === addon.id)
          return (
            <button
              key={addon.id}
              onClick={() => toggle(addon)}
              className={cn(
                'w-full flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-all',
                activo
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-white hover:border-primary/40'
              )}
            >
              <div className="min-w-0">
                <p className={cn('font-sans text-sm font-medium', activo ? 'text-primary' : 'text-brand-ink')}>
                  {addon.nombre}
                </p>
                {addon.descripcion && (
                  <p className="font-sans text-xs text-brand-ink-light mt-0.5">{addon.descripcion}</p>
                )}
                <div className="flex gap-3 mt-1 text-xs text-brand-ink-light">
                  {addon.precio > 0 && <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />+{formatPrecio(addon.precio)}</span>}
                  {addon.duracion_minutos > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />+{addon.duracion_minutos} min</span>}
                  {addon.precio === 0 && <span className="text-emerald-600 font-medium">Incluido</span>}
                </div>
              </div>
              <div className={cn(
                'shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
                activo ? 'border-primary bg-primary' : 'border-slate-300'
              )}>
                {activo && <CheckCircle2 className="h-3.5 w-3.5 text-white fill-white" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Resumen dinámico */}
      {seleccionados.length > 0 && (
        <div className="mb-4 rounded-xl bg-brand-purple-soft/30 px-4 py-2.5 flex items-center justify-between text-xs font-sans">
          <span className="text-brand-ink-light">Total con extras</span>
          <span className="font-semibold text-brand-ink">{formatPrecio(totalPrecio)} · {totalMin} min</span>
        </div>
      )}

      <Button onClick={onContinuar} className="w-full rounded-2xl">
        {seleccionados.length > 0 ? `Continuar con ${seleccionados.length} extra${seleccionados.length > 1 ? 's' : ''}` : 'Continuar sin extras'}
      </Button>
    </div>
  )
}

// ─── Formulario lista de espera ───────────────────────────────────────────────

function WaitlistForm({
  negocioId,
  servicioId,
  fecha,
  onSuccess,
  onCancel,
}: {
  negocioId: string
  servicioId: string
  fecha: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [nombre, setNombre]   = useState('')
  const [email, setEmail]     = useState('')
  const [tel, setTel]         = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [isPending, start]    = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !email.trim()) { setError('Nombre y email son obligatorios.'); return }
    setError(null)
    start(async () => {
      const res = await unirseListaEsperaAction({ negocioId, servicioId, fecha, nombre: nombre.trim(), email: email.trim(), telefono: tel.trim() || undefined })
      if (res.ok) onSuccess()
      else setError(res.error ?? 'Error al unirse a la lista.')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl border border-brand-purple-soft bg-brand-purple-soft/20 p-4">
      <p className="font-sans text-xs font-medium text-brand-purple">
        Te avisaremos por email si se libera un horario este día.
      </p>
      <div className="grid gap-1.5">
        <Label className="font-sans text-xs uppercase tracking-widest text-brand-ink-light">Nombre *</Label>
        <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" className="rounded-xl text-sm" required />
      </div>
      <div className="grid gap-1.5">
        <Label className="font-sans text-xs uppercase tracking-widest text-brand-ink-light">Email *</Label>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className="rounded-xl text-sm" required />
      </div>
      <div className="grid gap-1.5">
        <Label className="font-sans text-xs uppercase tracking-widest text-brand-ink-light">Teléfono (opcional)</Label>
        <Input type="tel" value={tel} onChange={e => setTel(e.target.value)} placeholder="+56 9 1234 5678" className="rounded-xl text-sm" />
      </div>
      {error && <p className="font-sans text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending} size="sm" className="flex-1 rounded-full text-xs">
          {isPending ? 'Enviando...' : 'Unirme a la lista'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="rounded-full text-xs text-brand-ink-light">
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function StepDatetime({
  negocioId,
  servicio,
  horarios,
  duracionOverride,
  onSelect,
  onBack,
}: {
  negocioId: string
  servicio: Servicio
  horarios: HorarioAtencion[]
  duracionOverride?: number
  onSelect: (fecha: string, hora: string) => void
  onBack: () => void
}) {
  const [fecha, setFecha] = useState<Date | undefined>()
  const [horas, setHoras] = useState<string[]>([])
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null)
  const [loadingHoras, setLoadingHoras] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [mostrarEspera, setMostrarEspera]   = useState(false)
  const [esperaExitosa, setEsperaExitosa]   = useState(false)

  const diasHabilitados = new Set(horarios.map(h => h.dia_semana))

  function isDisabled(date: Date): boolean {
    if (isBefore(date, startOfToday())) return true
    return !diasHabilitados.has(getISODay(date))
  }

  async function handleDaySelect(day: Date | undefined) {
    if (!day) return
    setFecha(day)
    setHoraSeleccionada(null)
    setHoras([])
    setMostrarEspera(false)
    setEsperaExitosa(false)
    setLoadingHoras(true)
    const fechaStr = format(day, 'yyyy-MM-dd')
    startTransition(async () => {
      const slots = await getHorasDisponibles(negocioId, servicio.id, fechaStr, duracionOverride)
      setHoras(slots)
      setLoadingHoras(false)
    })
  }

  const sinSlots = fecha && !loadingHoras && !isPending && horas.length === 0

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 font-sans text-sm text-brand-ink-light hover:text-brand-ink">
        <ChevronLeft className="h-4 w-4" /> Volver
      </button>
      <h2 className="mb-1 font-serif text-xl text-brand-ink">Elige fecha y hora</h2>
      <p className="mb-4 font-sans text-xs text-brand-ink-light">
        {servicio.nombre} · {servicio.duracion_minutos} min · {formatPrecio(servicio.precio)}
      </p>

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <Calendar
          mode="single"
          selected={fecha}
          onSelect={handleDaySelect}
          locale={es}
          disabled={isDisabled}
          fromDate={new Date()}
          toDate={addDays(new Date(), 60)}
          className="rounded-2xl border border-border bg-card p-3"
        />

        <div className="w-full flex-1">
          {!fecha && (
            <p className="py-4 text-center font-sans text-sm text-brand-ink-light">
              Selecciona un día en el calendario
            </p>
          )}

          {fecha && (
            <>
              <p className="mb-3 font-sans text-sm font-medium capitalize text-brand-ink">
                {formatFecha(format(fecha, 'yyyy-MM-dd'))}
              </p>

              {loadingHoras || isPending ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-muted" />
                  ))}
                </div>
              ) : horas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {horas.map(h => (
                    <button
                      key={h}
                      onClick={() => setHoraSeleccionada(h)}
                      className={cn(
                        'rounded-full border px-4 py-2 font-sans text-sm font-medium transition-all',
                        horaSeleccionada === h
                          ? 'border-transparent bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-white text-brand-ink hover:border-primary/50 hover:bg-brand-purple-soft/30'
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              ) : esperaExitosa ? (
                /* Éxito lista de espera */
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-brand-purple-soft/30 p-5 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-purple/10">
                    <BellPlus className="h-5 w-5 text-brand-purple" />
                  </div>
                  <p className="font-sans text-sm font-medium text-brand-ink">
                    ¡Listo! Estás en la lista de espera.
                  </p>
                  <p className="font-sans text-xs text-brand-ink-light">
                    Te enviaremos un email si se libera un turno este día.
                  </p>
                </div>
              ) : sinSlots && !mostrarEspera ? (
                /* Sin slots — invitación a lista de espera */
                <div className="space-y-3">
                  <p className="font-sans text-sm text-brand-ink-light">
                    No hay horarios disponibles para este día.
                  </p>
                  <button
                    onClick={() => setMostrarEspera(true)}
                    className="flex items-center gap-2 rounded-full border border-brand-purple px-4 py-2 font-sans text-sm font-medium text-brand-purple transition-colors hover:bg-brand-purple-soft/30"
                  >
                    <BellPlus className="h-4 w-4" />
                    Avisarme si se libera un turno
                  </button>
                </div>
              ) : sinSlots && mostrarEspera ? (
                <WaitlistForm
                  negocioId={negocioId}
                  servicioId={servicio.id}
                  fecha={format(fecha, 'yyyy-MM-dd')}
                  onSuccess={() => { setMostrarEspera(false); setEsperaExitosa(true) }}
                  onCancel={() => setMostrarEspera(false)}
                />
              ) : null}
            </>
          )}

          {horaSeleccionada && fecha && (
            <Button onClick={() => onSelect(format(fecha, 'yyyy-MM-dd'), horaSeleccionada)} className="mt-6 w-full rounded-2xl">
              Continuar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Datos ────────────────────────────────────────────────────────────

function StepDatos({ onSubmit, onBack, loading }: { onSubmit: (v: FormValues) => void; onBack: () => void; loading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(formSchema) })

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 font-sans text-sm text-brand-ink-light hover:text-brand-ink">
        <ChevronLeft className="h-4 w-4" /> Volver
      </button>
      <h2 className="mb-4 font-serif text-xl text-brand-ink">Tus datos</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="nombre" className="font-sans text-xs uppercase tracking-widest text-brand-ink-light">Nombre completo *</Label>
          <Input id="nombre" {...register('nombre')} placeholder="Tu nombre" className="rounded-xl" />
          {errors.nombre && <p className="font-sans text-xs text-red-500">{errors.nombre.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="email" className="font-sans text-xs uppercase tracking-widest text-brand-ink-light">Email *</Label>
          <Input id="email" type="email" {...register('email')} placeholder="tu@email.com" className="rounded-xl" />
          {errors.email && <p className="font-sans text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="telefono" className="font-sans text-xs uppercase tracking-widest text-brand-ink-light">Teléfono</Label>
          <Input id="telefono" type="tel" {...register('telefono')} placeholder="+56 9 1234 5678" className="rounded-xl" />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="notas" className="font-sans text-xs uppercase tracking-widest text-brand-ink-light">Notas adicionales</Label>
          <Textarea id="notas" {...register('notasCliente')} placeholder="¿Algo que debamos saber?" className="rounded-xl resize-none" rows={3} />
        </div>

        <Button type="submit" disabled={loading} className="mt-2 rounded-2xl">
          {loading ? 'Procesando...' : 'Revisar reserva'}
        </Button>
      </form>
    </div>
  )
}

// ─── Step 4: Confirmación ─────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-sans text-xs uppercase tracking-widest text-brand-ink-light">{label}</span>
      <span className="font-sans text-sm text-brand-ink text-right">{value}</span>
    </div>
  )
}

function StepConfirmacion({
  servicio, addons, precioTotal, fecha, hora, formValues, onConfirm, onBack, loading, error,
}: {
  servicio: Servicio; addons: ServicioAddon[]; precioTotal: number
  fecha: string; hora: string; formValues: FormValues
  onConfirm: () => void; onBack: () => void; loading: boolean; error: string | null
}) {
  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 font-sans text-sm text-brand-ink-light hover:text-brand-ink">
        <ChevronLeft className="h-4 w-4" /> Volver
      </button>
      <h2 className="mb-4 font-serif text-xl text-brand-ink">Confirma tu reserva</h2>

      {/* Foto del servicio si existe */}
      {servicio.foto_url && (
        <div className="mb-4 relative h-32 w-full overflow-hidden rounded-2xl">
          <Image src={servicio.foto_url} alt={servicio.nombre} fill className="object-cover" unoptimized />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 mb-6">
        <Row label="Servicio" value={servicio.nombre} />
        {addons.length > 0 && (
          <Row label="Extras" value={addons.map(a => a.nombre).join(', ')} />
        )}
        <Row label="Duración" value={`${servicio.duracion_minutos + addons.reduce((s,a) => s + a.duracion_minutos, 0)} min`} />
        <Row label="Precio" value={formatPrecio(precioTotal)} />
        <div className="border-t border-border" />
        <Row label="Fecha" value={<span className="capitalize">{formatFecha(fecha)}</span>} />
        <Row label="Hora" value={hora} />
        <div className="border-t border-border" />
        <Row label="Nombre" value={formValues.nombre} />
        <Row label="Email" value={formValues.email} />
        {formValues.telefono && <Row label="Teléfono" value={formValues.telefono} />}
        {formValues.notasCliente && <Row label="Notas" value={formValues.notasCliente} />}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 font-sans">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button onClick={onConfirm} disabled={loading} className="w-full rounded-2xl" size="lg">
        {loading ? 'Confirmando...' : 'Confirmar cita'}
      </Button>
    </div>
  )
}

// ─── Éxito ────────────────────────────────────────────────────────────────────

function Exito({ servicio, fecha, hora, nombre }: { servicio: Servicio; fecha: string; hora: string; nombre: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="font-serif text-2xl text-brand-ink">¡Reserva confirmada!</h2>
      <p className="font-sans text-sm text-brand-ink-light max-w-xs">
        Hola {nombre}, tu cita de <strong>{servicio.nombre}</strong> está agendada para el{' '}
        <strong className="capitalize">{formatFecha(fecha)}</strong> a las <strong>{hora}</strong>.
      </p>
      <p className="font-sans text-xs text-brand-ink-light">Recibirás un recordatorio por email.</p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function BookingFlow({ negocio, servicios, horarios }: Props) {
  const [step, setStep]                             = useState<Step>('servicio')
  const [servicioSeleccionado, setServicio]         = useState<Servicio | null>(null)
  const [addonsDisponibles, setAddonsDisponibles]   = useState<ServicioAddon[]>([])
  const [addonsSeleccionados, setAddonsSeleccionados] = useState<ServicioAddon[]>([])
  const [fechaSeleccionada, setFecha]               = useState<string>('')
  const [horaSeleccionada, setHora]                 = useState<string>('')
  const [formValues, setFormValues]                 = useState<FormValues | null>(null)
  const [submitError, setSubmitError]               = useState<string | null>(null)
  const [isPending, startTransition]                = useTransition()

  function duracionTotal() {
    if (!servicioSeleccionado) return 0
    return servicioSeleccionado.duracion_minutos + addonsSeleccionados.reduce((s, a) => s + a.duracion_minutos, 0)
  }
  function precioTotal() {
    if (!servicioSeleccionado) return 0
    return servicioSeleccionado.precio + addonsSeleccionados.reduce((s, a) => s + a.precio, 0)
  }

  function handleServicioSelect(s: Servicio) {
    setServicio(s)
    setAddonsSeleccionados([])
    startTransition(async () => {
      const addons = await getAddonsServicio(s.id)
      setAddonsDisponibles(addons)
      setStep(addons.length > 0 ? 'addons' : 'datetime')
    })
  }

  function handleConfirm() {
    if (!servicioSeleccionado || !formValues) return
    setSubmitError(null)
    startTransition(async () => {
      const result = await crearCitaPublicaAction({
        negocioId: negocio.id,
        servicioId: servicioSeleccionado.id,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
        nombre: formValues.nombre,
        email: formValues.email,
        telefono: formValues.telefono,
        notasCliente: formValues.notasCliente,
        duracionTotal: duracionTotal(),
        addonsNombres: addonsSeleccionados.map(a => a.nombre),
      })
      if (result.ok) setStep('exito')
      else setSubmitError(result.error ?? 'Error desconocido.')
    })
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-12">
      <Header negocio={negocio} />

      {step !== 'exito' && <StepIndicator step={step} />}

      <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm">
        {step === 'servicio' && (
          <StepServicio servicios={servicios} onSelect={handleServicioSelect} />
        )}

        {step === 'addons' && servicioSeleccionado && (
          <StepAddons
            servicio={servicioSeleccionado}
            addons={addonsDisponibles}
            seleccionados={addonsSeleccionados}
            onChange={setAddonsSeleccionados}
            onContinuar={() => setStep('datetime')}
            onBack={() => setStep('servicio')}
          />
        )}

        {step === 'datetime' && servicioSeleccionado && (
          <StepDatetime
            negocioId={negocio.id}
            servicio={servicioSeleccionado}
            horarios={horarios}
            duracionOverride={duracionTotal()}
            onSelect={(f, h) => { setFecha(f); setHora(h); setStep('datos') }}
            onBack={() => setStep(addonsDisponibles.length > 0 ? 'addons' : 'servicio')}
          />
        )}

        {step === 'datos' && (
          <StepDatos
            onSubmit={v => { setFormValues(v); setSubmitError(null); setStep('confirmacion') }}
            onBack={() => setStep('datetime')}
            loading={isPending}
          />
        )}

        {step === 'confirmacion' && servicioSeleccionado && formValues && (
          <StepConfirmacion
            servicio={servicioSeleccionado}
            addons={addonsSeleccionados}
            precioTotal={precioTotal()}
            fecha={fechaSeleccionada}
            hora={horaSeleccionada}
            formValues={formValues}
            onConfirm={handleConfirm}
            onBack={() => setStep('datos')}
            loading={isPending}
            error={submitError}
          />
        )}

        {step === 'exito' && servicioSeleccionado && formValues && (
          <Exito
            servicio={servicioSeleccionado}
            fecha={fechaSeleccionada}
            hora={horaSeleccionada}
            nombre={formValues.nombre}
          />
        )}
      </div>
    </div>
  )
}
