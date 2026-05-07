import { getServiciosNegocio } from '@/actions/dashboard'
import { ServiciosManager } from '@/components/dashboard/servicios-manager'
import type { Servicio } from '@/types/database'
import { Scissors } from 'lucide-react'

export default async function ServiciosPage() {
  let servicios: Servicio[] = []
  let errorMsg: string | null = null

  try {
    servicios = await getServiciosNegocio()
  } catch (e) {
    errorMsg = (e as Error).message
  }

  return (
    <div className="px-6 py-8 max-w-5xl">

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Scissors className="h-5 w-5 text-brand-purple" />
          <h1 className="font-serif tracking-tight text-3xl text-brand-ink">Mis Servicios</h1>
        </div>
        <p className="font-sans text-sm text-brand-ink-light">
          Gestiona los servicios que ofreces. Agrega fotos para que los clientes sepan qué esperar.
        </p>
      </div>

      {errorMsg ? (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
          No se pudieron cargar los servicios: {errorMsg}
        </div>
      ) : (
        <ServiciosManager servicios={servicios} />
      )}
    </div>
  )
}
