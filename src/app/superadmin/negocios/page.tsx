import { getNegociosConEmail } from '@/actions/superadmin'
import { NegociosTabla } from '@/components/superadmin/negocios-tabla'
import type { NegocioConEmail } from '@/types/database'
import { Building2 } from 'lucide-react'

export default async function SuperadminNegociosPage() {
  let negocios: NegocioConEmail[] = []
  let errorMsg: string | null = null

  try {
    negocios = await getNegociosConEmail()
  } catch (e) {
    errorMsg = (e as Error).message
  }

  const activos    = negocios.filter(n => n.estado_cuenta === 'activo').length
  const suspendidos = negocios.filter(n => n.estado_cuenta === 'suspendido').length
  const trials     = negocios.filter(n => n.estado_cuenta === 'trial').length

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-400" />
            <h1 className="text-2xl font-semibold text-slate-900">Negocios</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona el acceso, estado y suscripciones de todos los centros registrados.
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          {negocios.length} totales
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {activos} activos
        </span>
        {trials > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {trials} en trial
          </span>
        )}
        {suspendidos > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            {suspendidos} suspendidos
          </span>
        )}
      </div>

      {errorMsg ? (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Error al cargar negocios: {errorMsg}
        </div>
      ) : (
        <NegociosTabla negocios={negocios} />
      )}
    </div>
  )
}
