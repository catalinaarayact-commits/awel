import { getMetricasSuperadmin } from '@/actions/superadmin'
import {
  Building2,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Clock4,
  TrendingUp,
} from 'lucide-react'

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}

// ─── Estado breakdown chip ────────────────────────────────────────────────────

function EstadoBar({
  activos,
  suspendidos,
  trials,
  total,
}: {
  activos: number
  suspendidos: number
  trials: number
  total: number
}) {
  const pctActivo    = total ? Math.round((activos / total) * 100) : 0
  const pctSuspendido = total ? Math.round((suspendidos / total) * 100) : 0
  const pctTrial     = total ? Math.round((trials / total) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Estado de cuentas
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{total}</p>
          <p className="mt-1 text-xs text-slate-400">negocios registrados</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
          <TrendingUp className="h-5 w-5 text-violet-600" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${pctActivo}%` }}
          />
          <div
            className="h-full bg-amber-400 transition-all"
            style={{ width: `${pctTrial}%` }}
          />
          <div
            className="h-full bg-slate-300 transition-all"
            style={{ width: `${pctSuspendido}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {activos} activos ({pctActivo}%)
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          {trials} trial ({pctTrial}%)
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          {suspendidos} suspendidos
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SuperadminPage() {
  let metricas = null
  let errorMsg: string | null = null

  try {
    metricas = await getMetricasSuperadmin()
  } catch (e) {
    errorMsg = (e as Error).message
  }

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Resumen operativo de la plataforma awel
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Error al cargar métricas: {errorMsg}
        </div>
      )}

      {metricas && (
        <>
          {/* Metrics grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Negocios totales"
              value={metricas.totalNegocios}
              sub="Desde el inicio"
              icon={Building2}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <MetricCard
              label="Cuentas activas"
              value={metricas.activos}
              sub={`de ${metricas.totalNegocios} negocios`}
              icon={CheckCircle2}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <MetricCard
              label="Cuentas suspendidas"
              value={metricas.suspendidos}
              sub="Requieren gestión"
              icon={XCircle}
              iconBg="bg-red-50"
              iconColor="text-red-500"
            />
            <MetricCard
              label="Citas históricas"
              value={metricas.totalCitas.toLocaleString('es-CL')}
              sub="En toda la plataforma"
              icon={CalendarDays}
              iconBg="bg-violet-50"
              iconColor="text-violet-600"
            />
          </div>

          {/* Second row */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <EstadoBar
              activos={metricas.activos}
              suspendidos={metricas.suspendidos}
              trials={metricas.trials}
              total={metricas.totalNegocios}
            />

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Accesos rápidos
                </p>
                <Clock4 className="h-4 w-4 text-slate-300" />
              </div>
              <div className="mt-4 space-y-2">
                <a
                  href="/superadmin/negocios"
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <span>Gestionar negocios</span>
                  <span className="text-slate-400">→</span>
                </a>
                {metricas.suspendidos > 0 && (
                  <a
                    href="/superadmin/negocios"
                    className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    <span>
                      {metricas.suspendidos} cuenta{metricas.suspendidos > 1 ? 's' : ''} pendiente{metricas.suspendidos > 1 ? 's' : ''} de activación
                    </span>
                    <span className="text-amber-500">→</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
