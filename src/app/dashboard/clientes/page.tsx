import { getClientesDirectorio } from '@/actions/dashboard'
import { ClientesDirectorio } from '@/components/dashboard/clientes-directorio'
import type { ClienteConStats } from '@/types/database'
import { Users } from 'lucide-react'

export default async function ClientesPage() {
  let clientes: ClienteConStats[] = []
  let errorMsg: string | null = null

  try {
    clientes = await getClientesDirectorio()
  } catch (e) {
    errorMsg = (e as Error).message
  }

  return (
    <div className="px-6 py-8 max-w-5xl">

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Users className="h-5 w-5 text-brand-purple" />
          <h1 className="font-serif tracking-tight text-3xl text-brand-ink">Directorio de Clientes</h1>
        </div>
        <p className="font-sans text-sm text-brand-ink-light">
          Cada vez que alguien reserva en tu página pública, sus datos quedan guardados aquí. Haz clic en un cliente para ver su historial completo.
        </p>
      </div>

      {errorMsg ? (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600 font-sans">
          No se pudieron cargar los clientes: {errorMsg}
        </div>
      ) : (
        <ClientesDirectorio clientes={clientes} />
      )}
    </div>
  )
}
