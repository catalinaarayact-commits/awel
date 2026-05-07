import { getHorariosNegocio } from '@/actions/dashboard'
import { HorariosManager } from '@/components/dashboard/horarios-manager'
import type { HorarioAtencion } from '@/types/database'
import { Clock } from 'lucide-react'

export default async function HorariosPage() {
  let horarios: HorarioAtencion[] = []
  let errorMsg: string | null = null

  try {
    horarios = await getHorariosNegocio()
  } catch (e) {
    errorMsg = (e as Error).message
  }

  return (
    <div className="px-6 py-8 max-w-3xl">

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-5 w-5 text-brand-purple" />
          <h1 className="font-serif tracking-tight text-3xl text-brand-ink">Horarios de atención</h1>
        </div>
        <p className="font-sans text-sm text-brand-ink-light">
          Configura los días y horas en que recibes clientes. Solo los días activos aparecen en el calendario de reservas.
        </p>
      </div>

      {errorMsg ? (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
          No se pudieron cargar los horarios: {errorMsg}
        </div>
      ) : (
        <HorariosManager existentes={horarios} />
      )}
    </div>
  )
}
