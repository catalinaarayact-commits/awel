import { getConfigClima, getCampanasHistorial } from '@/actions/dashboard'
import { CampanasClima } from '@/components/dashboard/campanas-clima'

export default async function CampanasPage() {
  const [config, historial] = await Promise.all([
    getConfigClima(),
    getCampanasHistorial(),
  ])

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-brand-ink">Campañas por clima</h1>
        <p className="mt-2 font-sans text-sm text-brand-ink-light leading-relaxed">
          Activa emails automáticos que se envían a todos tus clientes cuando el clima
          acompaña: días de lluvia o olas de calor. Una forma natural de llenar tu agenda.
        </p>
      </div>

      <CampanasClima configInicial={config} historial={historial} />
    </div>
  )
}
