'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  crearServicioAction,
  editarServicioAction,
  toggleServicioAction,
  uploadFotoServicioAction,
  eliminarServicioAction,
  getAddonsAction,
  crearAddonAction,
  eliminarAddonAction,
} from '@/actions/dashboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import type { Servicio, ServicioAddon } from '@/types/database'
import { Plus, Pencil, Eye, EyeOff, Upload, Loader2, Clock, Banknote, ImageIcon, Trash2, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(precio)
}

// ─── Formulario de servicio (crear / editar) ──────────────────────────────────

function ServicioForm({
  servicio,
  onSuccess,
}: {
  servicio?: Servicio
  onSuccess: () => void
}) {
  const isEdit = !!servicio
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = isEdit
        ? await editarServicioAction({ ok: false }, formData)
        : await crearServicioAction({ ok: false }, formData)
      if (result.ok) onSuccess()
      else setError(result.error ?? 'Ocurrió un error.')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={servicio.id} />}

      <div className="grid gap-1.5">
        <Label htmlFor="nombre" className="font-sans text-xs uppercase tracking-widest text-brand-ink-light">
          Nombre *
        </Label>
        <Input id="nombre" name="nombre" defaultValue={servicio?.nombre} placeholder="Ej: Masaje relajante" className="rounded-xl" required />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="descripcion" className="font-sans text-xs uppercase tracking-widest text-brand-ink-light">
          Descripción
        </Label>
        <textarea
          id="descripcion"
          name="descripcion"
          defaultValue={servicio?.descripcion ?? ''}
          placeholder="Breve descripción del servicio..."
          rows={2}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="duracion_minutos" className="font-sans text-xs uppercase tracking-widest text-brand-ink-light">
            Duración (min) *
          </Label>
          <Input
            id="duracion_minutos"
            name="duracion_minutos"
            type="number"
            min="5"
            step="5"
            defaultValue={servicio?.duracion_minutos ?? 60}
            className="rounded-xl"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="precio" className="font-sans text-xs uppercase tracking-widest text-brand-ink-light">
            Precio (CLP) *
          </Label>
          <Input
            id="precio"
            name="precio"
            type="number"
            min="0"
            max="1000000"
            step="1"
            defaultValue={servicio?.precio ?? 0}
            className="rounded-xl"
            required
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={isPending} className="flex-1 rounded-2xl text-sm">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? 'Guardar cambios' : 'Crear servicio'}
        </Button>
        <DialogClose render={<Button type="button" variant="outline" className="rounded-2xl text-sm" />}>
          Cancelar
        </DialogClose>
      </div>
    </form>
  )
}

// ─── Uploader de foto de servicio ─────────────────────────────────────────────

function FotoUploader({ servicio, onSuccess }: { servicio: Servicio; onSuccess: (url: string) => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setError(null)
    const fd = new FormData()
    fd.append('servicio_id', servicio.id)
    fd.append('foto', file)
    startTransition(async () => {
      const result = await uploadFotoServicioAction({ ok: false }, fd)
      if (result.ok && result.data) onSuccess(result.data)
      else setError(result.error ?? 'Error al subir.')
    })
  }

  return (
    <div className="space-y-1">
      <div
        className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-brand-purple hover:bg-brand-purple-soft/20"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-brand-purple') }}
        onDragLeave={e => e.currentTarget.classList.remove('border-brand-purple')}
        onDrop={e => {
          e.preventDefault()
          e.currentTarget.classList.remove('border-brand-purple')
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />
        ) : (
          <>
            <ImageIcon className="h-5 w-5 text-slate-400" />
            <p className="text-center text-xs text-slate-500">
              Subir foto<br />
              <span className="text-slate-400">PNG, JPG, WEBP</span>
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={e => { const file = e.target.files?.[0]; if (file) handleFile(file) }}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Dialog de confirmación de eliminación ────────────────────────────────────

function ConfirmDeleteDialog({
  open,
  onOpenChange,
  nombre,
  onConfirm,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nombre: string
  onConfirm: () => void
  isPending: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-brand-ink">¿Eliminar servicio?</DialogTitle>
        </DialogHeader>
        <p className="font-sans text-sm text-brand-ink-light">
          Se eliminará <span className="font-medium text-brand-ink">"{nombre}"</span> de forma permanente. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2 pt-1">
          <Button
            variant="destructive"
            className="flex-1 rounded-2xl text-sm"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sí, eliminar'}
          </Button>
          <DialogClose render={<Button type="button" variant="outline" className="flex-1 rounded-2xl text-sm" />}>
            Cancelar
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog de Add-ons ───────────────────────────────────────────────────────

function AddonsDialog({ servicio, open, onOpenChange }: { servicio: Servicio; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [addons, setAddons]         = useState<ServicioAddon[]>([])
  const [loading, startLoad]        = useTransition()
  const [saving, startSave]         = useTransition()
  const [deleting, startDelete]     = useTransition()
  const [nombre, setNombre]         = useState('')
  const [precio, setPrecio]         = useState(0)
  const [duracion, setDuracion]     = useState(0)
  const [formError, setFormError]   = useState<string | null>(null)

  // Cargar add-ons al abrir el dialog
  const prevOpen = useRef(false)
  if (open && !prevOpen.current) {
    startLoad(async () => {
      const data = await getAddonsAction(servicio.id)
      setAddons(data)
    })
  }
  prevOpen.current = open

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setFormError('El nombre es obligatorio.'); return }
    setFormError(null)
    startSave(async () => {
      const res = await crearAddonAction({ servicioId: servicio.id, nombre: nombre.trim(), precio, duracionMinutos: duracion })
      if (res.ok) {
        const data = await getAddonsAction(servicio.id)
        setAddons(data)
        setNombre(''); setPrecio(0); setDuracion(0)
      } else {
        setFormError(res.error ?? 'Error al guardar.')
      }
    })
  }

  function handleDelete(id: string) {
    startDelete(async () => {
      await eliminarAddonAction(id)
      setAddons(prev => prev.filter(a => a.id !== id))
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-brand-ink flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-purple" />
            Extras de "{servicio.nombre}"
          </DialogTitle>
        </DialogHeader>
        <p className="font-sans text-xs text-brand-ink-light -mt-1">
          Los extras aparecen en el paso de reserva para que el cliente los añada opcionalmente.
        </p>

        {/* Lista de add-ons existentes */}
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {loading ? (
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ) : addons.length === 0 ? (
            <p className="py-3 text-center font-sans text-xs text-brand-ink-light">Sin extras — agrega el primero abajo.</p>
          ) : addons.map(a => (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
              <div className="min-w-0">
                <p className="font-sans text-sm font-medium text-brand-ink truncate">{a.nombre}</p>
                <div className="flex gap-3 mt-0.5 text-xs text-brand-ink-light">
                  <span>{a.precio > 0 ? `+${formatPrecio(a.precio)}` : 'Incluido'}</span>
                  {a.duracion_minutos > 0 && <span>+{a.duracion_minutos} min</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                disabled={deleting}
                className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Formulario para nuevo add-on */}
        <form onSubmit={handleAdd} className="space-y-3 border-t border-slate-100 pt-3">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-brand-ink-light">Nuevo extra</p>
          <div className="grid gap-1.5">
            <Input
              placeholder="Nombre del extra (ej: Diseño, Francesa)"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">Precio (CLP)</Label>
              <Input type="number" min={0} step={1} value={precio} onChange={e => setPrecio(Number(e.target.value))} className="rounded-xl text-sm" />
            </div>
            <div className="grid gap-1">
              <Label className="font-sans text-[10px] uppercase tracking-widest text-brand-ink-light">Min extra</Label>
              <Input type="number" min={0} step={5} value={duracion} onChange={e => setDuracion(Number(e.target.value))} className="rounded-xl text-sm" />
            </div>
          </div>
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <Button type="submit" disabled={saving} size="sm" className="w-full rounded-xl text-xs gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Agregar extra</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Tarjeta de servicio ──────────────────────────────────────────────────────

function ServicioCard({
  servicio: initialServicio,
  onEdit,
  onDeleted,
}: {
  servicio: Servicio
  onEdit: (s: Servicio) => void
  onDeleted: (id: string) => void
}) {
  const [servicio, setServicio] = useState(initialServicio)
  const [toggling, startToggle] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [addonsOpen, setAddonsOpen]   = useState(false)

  function handleToggle() {
    startToggle(async () => {
      const result = await toggleServicioAction(servicio.id, !servicio.activo)
      if (result.ok) setServicio(s => ({ ...s, activo: !s.activo }))
    })
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await eliminarServicioAction(servicio.id)
      if (result.ok) {
        setConfirmOpen(false)
        onDeleted(servicio.id)
      }
    })
  }

  return (
    <>
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        nombre={servicio.nombre}
        onConfirm={handleDelete}
        isPending={deleting}
      />
      <AddonsDialog servicio={servicio} open={addonsOpen} onOpenChange={setAddonsOpen} />

      <div className={cn(
        'rounded-2xl border bg-white shadow-sm transition-all',
        servicio.activo ? 'border-slate-100' : 'border-slate-100 opacity-60'
      )}>
        {/* Foto */}
        <div className="relative h-36 w-full overflow-hidden rounded-t-2xl bg-brand-oat">
          {servicio.foto_url ? (
            <Image
              src={servicio.foto_url}
              alt={servicio.nombre}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FotoUploader servicio={servicio} onSuccess={url => setServicio(s => ({ ...s, foto_url: url }))} />
            </div>
          )}
          {servicio.foto_url && (
            <button
              onClick={() => document.getElementById(`foto-input-${servicio.id}`)?.click()}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              title="Cambiar foto"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          )}
          {servicio.foto_url && (
            <input
              id={`foto-input-${servicio.id}`}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const fd = new FormData()
                fd.append('servicio_id', servicio.id)
                fd.append('foto', file)
                uploadFotoServicioAction({ ok: false }, fd).then(result => {
                  if (result.ok && result.data) setServicio(s => ({ ...s, foto_url: result.data! }))
                })
              }}
            />
          )}
        </div>

        {/* Contenido */}
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-sans font-medium text-brand-ink truncate">{servicio.nombre}</p>
              {servicio.descripcion && (
                <p className="mt-0.5 font-sans text-xs text-brand-ink-light line-clamp-2">{servicio.descripcion}</p>
              )}
            </div>
            <span className={cn(
              'shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-widest',
              servicio.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
            )}>
              {servicio.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-brand-ink-light">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{servicio.duracion_minutos} min</span>
            <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />{formatPrecio(servicio.precio)}</span>
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(servicio)}
              className="flex-1 rounded-xl text-xs gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggle}
              disabled={toggling}
              className="flex-1 rounded-xl text-xs gap-1.5"
            >
              {toggling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : servicio.activo ? (
                <><EyeOff className="h-3.5 w-3.5" /> Desactivar</>
              ) : (
                <><Eye className="h-3.5 w-3.5" /> Activar</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddonsOpen(true)}
              className="rounded-xl text-xs gap-1 text-brand-purple border-brand-purple-soft hover:bg-brand-purple-soft/30"
              title="Gestionar extras"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              className="rounded-xl text-xs text-red-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Manager principal ────────────────────────────────────────────────────────

export function ServiciosManager({ servicios: initialServicios }: { servicios: Servicio[] }) {
  const router = useRouter()
  const [servicios, setServicios] = useState(initialServicios)
  const [editando, setEditando] = useState<Servicio | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function openCreate() {
    setEditando(null)
    setDialogOpen(true)
  }

  function openEdit(s: Servicio) {
    setEditando(s)
    setDialogOpen(true)
  }

  function handleSuccess() {
    setDialogOpen(false)
    router.refresh()
  }

  function handleDeleted(id: string) {
    setServicios(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-6">

      {/* Header + botón nuevo */}
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-brand-ink-light">
          {servicios.length} {servicios.length === 1 ? 'servicio' : 'servicios'} registrados
        </p>
        <Button
          onClick={openCreate}
          className="gap-2 rounded-2xl font-sans text-xs uppercase tracking-widest"
          size="sm"
        >
          <Plus className="h-4 w-4" /> Nuevo servicio
        </Button>
      </div>

      {/* Dialog crear / editar */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-brand-ink">
              {editando ? 'Editar servicio' : 'Nuevo servicio'}
            </DialogTitle>
          </DialogHeader>
          <ServicioForm key={editando?.id ?? 'new'} servicio={editando ?? undefined} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Grid de servicios */}
      {servicios.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-oat">
            <Banknote className="h-6 w-6 text-brand-ink-light" />
          </div>
          <p className="font-sans text-sm text-brand-ink-light max-w-xs">
            Aún no tienes servicios. Crea el primero para que aparezca en tu página de reservas.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicios.map(s => (
            <ServicioCard key={s.id} servicio={s} onEdit={openEdit} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  )
}
