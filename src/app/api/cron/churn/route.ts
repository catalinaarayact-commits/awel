/**
 * GET /api/cron/churn
 *
 * Ejecutado cada lunes a las 09:00 hora Chile (12:00 UTC) por Vercel Cron.
 * Detecta clientes en riesgo de fuga (churn) y envía un email de reactivación.
 *
 * Algoritmo:
 *   - Para cada cliente con ≥ 2 citas completadas:
 *       avgInterval = promedio de gaps entre visitas consecutivas
 *       threshold   = avgInterval × 1.33
 *       isAtRisk    = díasDesdeÚltimaVisita > threshold
 *   - Si está en riesgo Y no ha recibido email en los últimos 30 días → enviar.
 *
 * Protegido con Authorization: Bearer <CRON_SECRET>.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { computeChurnRisk, servicioFavorito } from '@/lib/churn'
import { enviarEmailReactivacion } from '@/lib/email'

const DIAS_COOLDOWN = 30                                    // no molestar antes de 30 días
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://awel.cl'

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {

  // ── Auth ────────────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createServiceClient()
  const hoy      = new Date()

  // ── Tipos locales ────────────────────────────────────────────────────────────
  type NegocioRow = { id: string; nombre_negocio: string; logo_url: string | null; slug: string }
  type ClienteRow = { id: string; negocio_id: string; nombre: string; email: string | null; ultimo_churn_email: string | null }

  // ── 1. Obtener todos los negocios activos ───────────────────────────────────
  const { data: negociosRaw } = await supabase
    .from('perfiles_negocio')
    .select('id, nombre_negocio, logo_url, slug')
    .eq('estado_cuenta', 'activo')

  const negocios = (negociosRaw ?? []) as NegocioRow[]
  if (!negocios.length) {
    return NextResponse.json({ ok: true, enviados: 0 })
  }

  // ── 2. Obtener clientes elegibles (email no nulo, cooldown superado) ────────
  const cooldownFecha = new Date(hoy.getTime() - DIAS_COOLDOWN * 24 * 60 * 60 * 1000).toISOString()

  const { data: clientesRaw } = await supabase
    .from('clientes')
    .select('id, negocio_id, nombre, email, ultimo_churn_email')
    .in('negocio_id', negocios.map((n: NegocioRow) => n.id))
    .not('email', 'is', null)
    .or(`ultimo_churn_email.is.null,ultimo_churn_email.lt.${cooldownFecha}`)

  const clientes = (clientesRaw ?? []) as ClienteRow[]

  if (!clientes.length) {
    console.log('[cron/churn] Sin clientes elegibles.')
    return NextResponse.json({ ok: true, enviados: 0 })
  }

  const clienteIds = clientes.map((c: ClienteRow) => c.id)

  // ── 3. Obtener historial de citas completadas/confirmadas para esos clientes ─
  const { data: citas } = await supabase
    .from('citas')
    .select('cliente_id, fecha_hora_inicio, servicio_id, servicios(nombre)')
    .in('cliente_id', clienteIds)
    .in('estado', ['completada', 'confirmada'])
    .order('fecha_hora_inicio', { ascending: true })

  // Agrupar citas por cliente
  type CitaRow = {
    cliente_id: string
    fecha_hora_inicio: string
    servicios: { nombre: string } | null
  }

  const citasPorCliente = new Map<string, CitaRow[]>()
  for (const cita of (citas as unknown as CitaRow[]) ?? []) {
    const arr = citasPorCliente.get(cita.cliente_id) ?? []
    arr.push(cita)
    citasPorCliente.set(cita.cliente_id, arr)
  }

  // Índice de negocios para lookup rápido
  const negocioMap = new Map(negocios.map((n: NegocioRow) => [n.id, n]))

  // ── 4. Evaluar churn por cliente y enviar emails ────────────────────────────
  let enviados = 0

  for (const cliente of clientes) {
    const historial = citasPorCliente.get(cliente.id) ?? []
    if (historial.length < 2) continue  // no hay suficiente historial

    const timestamps = historial.map(c => c.fecha_hora_inicio)
    const stats      = computeChurnRisk(timestamps, hoy)
    if (!stats?.isAtRisk) continue

    const negocio = negocioMap.get(cliente.negocio_id)
    if (!negocio || !cliente.email) continue

    const favorito = servicioFavorito(
      historial
        .filter(c => c.servicios?.nombre)
        .map(c => ({ servicio_nombre: c.servicios!.nombre }))
    )

    try {
      await enviarEmailReactivacion({
        to:               cliente.email,
        clienteNombre:    cliente.nombre,
        negocioNombre:    negocio.nombre_negocio,
        negocioLogo:      negocio.logo_url,
        servicioFavorito: favorito,
        diasSinVisita:    stats.daysSinceLastVisit,
        urlReserva:       `${BASE_URL}/${negocio.slug}`,
      })

      await supabase
        .from('clientes')
        .update({ ultimo_churn_email: hoy.toISOString() })
        .eq('id', cliente.id)

      enviados++
    } catch (err) {
      console.error(`[cron/churn] Error enviando email a cliente ${cliente.id}:`, err)
    }
  }

  console.log(`[cron/churn] Emails de reactivación enviados: ${enviados}`)

  return NextResponse.json({
    ok: true,
    enviados,
    timestamp: hoy.toISOString(),
  })
}
