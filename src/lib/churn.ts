/**
 * Churn Detection — lógica pura sin dependencias externas.
 *
 * Algoritmo:
 *   1. Ordena las citas del cliente por fecha ascendente.
 *   2. Calcula el intervalo promedio entre visitas consecutivas.
 *   3. Si (días desde última visita) > (intervalo promedio × 1.33) → en riesgo.
 *
 * Requiere mínimo 2 citas para estimar el patrón de visita.
 */

export interface ChurnStats {
  isAtRisk:           boolean
  avgIntervalDays:    number  // intervalo promedio entre visitas (redondeado)
  daysSinceLastVisit: number  // días desde la última visita (redondeado)
  thresholdDays:      number  // umbral de riesgo = avgInterval × 1.33
}

const FACTOR_RIESGO = 1.33
const MS_POR_DIA    = 1000 * 60 * 60 * 24

/**
 * Calcula el estado de churn para un cliente dado su historial de visitas.
 *
 * @param citaTimestamps  Array de ISO strings de `fecha_hora_inicio` (cualquier orden).
 * @param hoy             Fecha de referencia (por defecto: ahora). Util para tests.
 * @returns               ChurnStats o `null` si hay menos de 2 visitas.
 */
export function computeChurnRisk(
  citaTimestamps: string[],
  hoy: Date = new Date()
): ChurnStats | null {
  if (citaTimestamps.length < 2) return null

  // Ordenar fechas ascendente como ms
  const sorted = citaTimestamps
    .map(t => new Date(t).getTime())
    .sort((a, b) => a - b)

  // Intervalo promedio entre visitas consecutivas
  let totalGapMs = 0
  for (let i = 1; i < sorted.length; i++) {
    totalGapMs += sorted[i] - sorted[i - 1]
  }
  const avgIntervalMs   = totalGapMs / (sorted.length - 1)
  const avgIntervalDays = avgIntervalMs / MS_POR_DIA
  const thresholdDays   = avgIntervalDays * FACTOR_RIESGO

  // Días desde la última visita
  const lastVisitMs          = sorted[sorted.length - 1]
  const daysSinceLastVisit   = (hoy.getTime() - lastVisitMs) / MS_POR_DIA

  return {
    isAtRisk:           daysSinceLastVisit > thresholdDays,
    avgIntervalDays:    Math.round(avgIntervalDays),
    daysSinceLastVisit: Math.round(daysSinceLastVisit),
    thresholdDays:      Math.round(thresholdDays),
  }
}

/**
 * Devuelve el nombre del servicio más frecuente entre un listado de pares
 * (servicioNombre, cantidad) derivados de las citas del cliente.
 * Si hay empate, retorna el primero que aparezca.
 */
export function servicioFavorito(
  citas: Array<{ servicio_nombre: string }>
): string | null {
  if (!citas.length) return null

  const contador = new Map<string, number>()
  for (const c of citas) {
    contador.set(c.servicio_nombre, (contador.get(c.servicio_nombre) ?? 0) + 1)
  }

  let maxCount = 0
  let favorito = ''
  for (const [nombre, count] of contador) {
    if (count > maxCount) { maxCount = count; favorito = nombre }
  }
  return favorito || null
}
