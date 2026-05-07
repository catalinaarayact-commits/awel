import { getCitasAgenda, getMetricasAgenda } from '@/actions/dashboard'
import { AgendaTable } from '@/components/dashboard/agenda-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Clock, CheckCircle2 } from 'lucide-react'
import type { CitaConDetalle, MetricasAgenda } from '@/types/database'

// ─── Tarjeta de métrica ───────────────────────────────────────────────────────

function MetricaCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <Card className="rounded-2xl border-slate-100 bg-white shadow-sm ring-0">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="font-sans text-xs font-medium uppercase tracking-widest text-brand-ink-light">
            {label}
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}22` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="font-serif text-4xl tracking-tight text-brand-ink">{value}</p>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AgendaPage() {
  let citas: CitaConDetalle[] = []
  let metricas: MetricasAgenda = { citasHoy: 0, citasPendientes: 0, citasSemana: 0 }
  let errorMsg: string | null = null

  try {
    ;[citas, metricas] = await Promise.all([getCitasAgenda(), getMetricasAgenda()])
  } catch (e) {
    errorMsg = (e as Error).message
  }

  return (
    <div className="px-6 py-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="h-5 w-5 text-brand-purple" />
          <h1 className="font-serif tracking-tight text-3xl text-brand-ink">Mi Agenda</h1>
        </div>
        <p className="font-sans text-sm text-brand-ink-light">
          Gestiona las reservas de tu negocio y actualiza el estado de cada cita.
        </p>
      </div>

      {errorMsg ? (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
          No se pudo cargar la agenda: {errorMsg}
        </div>
      ) : (
        <>
          {/* Métricas */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricaCard
              icon={CalendarDays}
              label="Citas para hoy"
              value={metricas.citasHoy}
              color="#D98CF4"
            />
            <MetricaCard
              icon={Clock}
              label="Pendientes de confirmar"
              value={metricas.citasPendientes}
              color="#8CA7F4"
            />
            <MetricaCard
              icon={CheckCircle2}
              label="Esta semana"
              value={metricas.citasSemana}
              color="#DBF48C"
            />
          </div>

          {/* Tabla */}
          <AgendaTable citas={citas} />
        </>
      )}
    </div>
  )
}
