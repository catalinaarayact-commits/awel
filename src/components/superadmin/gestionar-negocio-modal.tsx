'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { gestionarNegocioAction } from '@/actions/superadmin'
import type { NegocioConEmail, EstadoCuenta } from '@/types/database'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fechaEnX(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

const ESTADO_LABELS: Record<EstadoCuenta, string> = {
  activo:     'Activo',
  suspendido: 'Suspendido',
  trial:      'Trial',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  negocio: NegocioConEmail
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GestionarNegocioModal({ negocio, open, onOpenChange }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [estado, setEstado] = useState<EstadoCuenta>(negocio.estado_cuenta)
  const [fechaVencimiento, setFechaVencimiento] = useState(
    negocio.fecha_vencimiento_suscripcion ?? ''
  )
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState<string>('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const registrarPago = monto.trim() !== '' && Number(monto) > 0

  function handleClose(val: boolean) {
    if (!isPending) {
      setError(null)
      setSuccess(false)
      onOpenChange(val)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (registrarPago && !metodoPago) {
      setError('Selecciona un método de pago para registrar el cobro.')
      return
    }

    startTransition(async () => {
      const result = await gestionarNegocioAction({
        negocioId: negocio.id,
        estadoCuenta: estado,
        fechaVencimiento: fechaVencimiento || null,
        montoPagado: registrarPago ? Number(monto) : null,
        metodoPago: registrarPago ? metodoPago : null,
        notasSuperadmin: notas || null,
      })

      if (!result.ok) {
        setError(result.error ?? 'Error desconocido')
        return
      }

      setSuccess(true)
      router.refresh()
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
      }, 1200)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Gestionar negocio
          </DialogTitle>
          <DialogDescription className="text-sm">
            <span className="font-medium text-slate-700">{negocio.nombre_negocio}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="text-slate-400">{negocio.email}</span>
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Cambios guardados</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Estado actual */}
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">Estado actual:</span>
              <EstadoBadge estado={negocio.estado_cuenta} />
            </div>

            {/* Sección: Estado de cuenta */}
            <div className="space-y-1.5">
              <Label htmlFor="estado-select" className="text-sm font-medium">
                Nuevo estado
              </Label>
              <Select
                value={estado}
                onValueChange={(val) => setEstado(val as EstadoCuenta)}
              >
                <SelectTrigger id="estado-select" className="w-full">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha de vencimiento */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="fecha-vencimiento" className="text-sm font-medium">
                  Fecha de vencimiento
                </Label>
                <div className="flex gap-1.5">
                  {[30, 60, 90].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFechaVencimiento(fechaEnX(d))}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      +{d}d
                    </button>
                  ))}
                </div>
              </div>
              <Input
                id="fecha-vencimiento"
                type="date"
                value={fechaVencimiento}
                onChange={e => setFechaVencimiento(e.target.value)}
              />
            </div>

            <Separator />

            {/* Sección: Registrar pago */}
            <div>
              <p className="mb-3 text-sm font-medium text-slate-700">
                Registrar pago{' '}
                <span className="font-normal text-slate-400">(opcional)</span>
              </p>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="monto" className="text-sm">
                      Monto (CLP)
                    </Label>
                    <Input
                      id="monto"
                      type="number"
                      placeholder="59.900"
                      min="0"
                      step="1"
                      value={monto}
                      onChange={e => setMonto(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="metodo-select" className="text-sm">
                      Método de pago
                    </Label>
                    <Select
                      value={metodoPago}
                      onValueChange={(val) => setMetodoPago(val ?? '')}
                    >
                      <SelectTrigger id="metodo-select" className="w-full">
                        <SelectValue placeholder="Método..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Flow">Flow</SelectItem>
                        <SelectItem value="Transferencia">Transferencia</SelectItem>
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notas" className="text-sm">
                    Notas internas
                  </Label>
                  <Textarea
                    id="notas"
                    placeholder="Ej: Pago recibido vía Flow el 05/05. Comprobante enviado por email."
                    rows={2}
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Badge de estado ──────────────────────────────────────────────────────────

export function EstadoBadge({ estado }: { estado: EstadoCuenta }) {
  if (estado === 'activo') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-transparent hover:bg-emerald-100">
        Activo
      </Badge>
    )
  }
  if (estado === 'trial') {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-transparent hover:bg-amber-100">
        Trial
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-slate-500">
      Suspendido
    </Badge>
  )
}
