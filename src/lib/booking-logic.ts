/**
 * Pure slot-generation engine. No DB calls — receives already-fetched data.
 * Uses epoch-ms comparisons so timezone offsets are irrelevant once dates
 * are constructed with the local Date constructor.
 */

export interface OcupadoMs {
  inicio: number
  fin: number
}

export interface SlotsInput {
  fecha: string          // YYYY-MM-DD (local date)
  aperturaH: number
  aperturaM: number
  cierreH: number
  cierreM: number
  duracionMinutos: number
  ocupadas: OcupadoMs[]
  slotsEspecificos?: string[] | null  // ["HH:mm", …] — cuando modo = 'especifico'
}

/**
 * Returns available time slots as "HH:mm" strings.
 * - modo 'especifico': filters the fixed list against existing bookings.
 * - modo 'rango': generates slots every duracionMinutos from apertura to cierre.
 */
export function calcularSlotsDisponibles({
  fecha,
  aperturaH,
  aperturaM,
  cierreH,
  cierreM,
  duracionMinutos,
  ocupadas,
  slotsEspecificos,
}: SlotsInput): string[] {
  const [y, mo, d] = fecha.split('-').map(Number)
  const durMs = duracionMinutos * 60_000

  if (slotsEspecificos && slotsEspecificos.length > 0) {
    return slotsEspecificos.filter(slot => {
      const [h, m] = slot.split(':').map(Number)
      const startMs = new Date(y, mo - 1, d, h, m, 0, 0).getTime()
      const endMs = startMs + durMs
      return !ocupadas.some(c => startMs < c.fin && endMs > c.inicio)
    })
  }

  const cierreMs = new Date(y, mo - 1, d, cierreH, cierreM, 0, 0).getTime()
  const slots: string[] = []
  let cursorMs = new Date(y, mo - 1, d, aperturaH, aperturaM, 0, 0).getTime()

  while (cursorMs + durMs <= cierreMs) {
    const slotFinMs = cursorMs + durMs
    const overlap = ocupadas.some(c => cursorMs < c.fin && slotFinMs > c.inicio)

    if (!overlap) {
      const dt = new Date(cursorMs)
      const hh = dt.getHours().toString().padStart(2, '0')
      const mm = dt.getMinutes().toString().padStart(2, '0')
      slots.push(`${hh}:${mm}`)
    }
    cursorMs += durMs
  }

  return slots
}
