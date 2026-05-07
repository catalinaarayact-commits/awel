/**
 * GET /api/cron/recordatorios
 *
 * Revisado cada 15 minutos por Vercel Cron.
 * Envía recordatorios de cita a clientes:
 *   - 24 h antes (ventana: 23 h 50 m – 24 h 10 m)
 *   - 2 h antes  (ventana:  1 h 50 m –  2 h 10 m)
 *
 * Protegido con Authorization: Bearer <CRON_SECRET>.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { enviarEmailRecordatorio } from '@/lib/email'
import { format } from 'date-fns'

// ─── Constantes de ventana ────────────────────────────────────────────────────

const VENTANA_MIN = 10 * 60 * 1000        // ±10 min de tolerancia
const H24_MS      = 24 * 60 * 60 * 1000
const H2_MS       =  2 * 60 * 60 * 1000

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ventana(centroMs: number): { desde: string; hasta: string } {
  return {
    desde: new Date(centroMs - VENTANA_MIN).toISOString(),
    hasta: new Date(centroMs + VENTANA_MIN).toISOString(),
  }
}

function horaDesdeIso(iso: string): string {
  // Muestra la hora tal como fue guardada (en UTC = hora local del servidor)
  const d = new Date(iso)
  const hh = d.getUTCHours().toString().padStart(2, '0')
  const mm = d.getUTCMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

function fechaDesdeIso(iso: string): string {
  // YYYY-MM-DD extraído del timestamp UTC
  return iso.slice(0, 10)
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {

  // ── Autenticación del CRON ──────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = await createServiceClient()
  const ahora    = Date.now()

  // ── Construir las dos ventanas de tiempo ────────────────────────────────────
  const v24 = ventana(ahora + H24_MS)
  const v2  = ventana(ahora + H2_MS)

  // ── Consulta: citas que caen en cada ventana y NO tienen recordatorio enviado
  const [res24, res2] = await Promise.all([
    supabase
      .from('citas')
      .select(`
        id,
        fecha_hora_inicio,
        clientes ( nombre, email ),
        servicios ( nombre, duracion_minutos ),
        perfiles_negocio ( nombre_negocio, logo_url )
      `)
      .in('estado', ['pendiente', 'confirmada'])
      .eq('recordatorio_24h_enviado', false)
      .gte('fecha_hora_inicio', v24.desde)
      .lte('fecha_hora_inicio', v24.hasta),

    supabase
      .from('citas')
      .select(`
        id,
        fecha_hora_inicio,
        clientes ( nombre, email ),
        servicios ( nombre, duracion_minutos ),
        perfiles_negocio ( nombre_negocio, logo_url )
      `)
      .in('estado', ['pendiente', 'confirmada'])
      .eq('recordatorio_2h_enviado', false)
      .gte('fecha_hora_inicio', v2.desde)
      .lte('fecha_hora_inicio', v2.hasta),
  ])

  type CitaRow = {
    id: string
    fecha_hora_inicio: string
    clientes: { nombre: string; email: string | null } | null
    servicios: { nombre: string; duracion_minutos: number } | null
    perfiles_negocio: { nombre_negocio: string; logo_url: string | null } | null
  }

  const citas24: CitaRow[] = (res24.data as unknown as CitaRow[]) ?? []
  const citas2:  CitaRow[] = (res2.data  as unknown as CitaRow[]) ?? []

  let enviados24 = 0
  let enviados2  = 0

  // ── Enviar recordatorios 24 h ───────────────────────────────────────────────
  for (const cita of citas24) {
    const email = cita.clientes?.email
    if (!email || !cita.servicios || !cita.perfiles_negocio) continue

    try {
      await enviarEmailRecordatorio({
        to:               email,
        clienteNombre:    cita.clientes!.nombre,
        negocioNombre:    cita.perfiles_negocio.nombre_negocio,
        negocioLogo:      cita.perfiles_negocio.logo_url,
        servicioNombre:   cita.servicios.nombre,
        duracionMinutos:  cita.servicios.duracion_minutos,
        fecha:            fechaDesdeIso(cita.fecha_hora_inicio),
        hora:             horaDesdeIso(cita.fecha_hora_inicio),
        tipo:             '24h',
      })

      await supabase
        .from('citas')
        .update({ recordatorio_24h_enviado: true })
        .eq('id', cita.id)

      enviados24++
    } catch (err) {
      console.error(`[cron] Error recordatorio 24h cita ${cita.id}:`, err)
    }
  }

  // ── Enviar recordatorios 2 h ────────────────────────────────────────────────
  for (const cita of citas2) {
    const email = cita.clientes?.email
    if (!email || !cita.servicios || !cita.perfiles_negocio) continue

    try {
      await enviarEmailRecordatorio({
        to:               email,
        clienteNombre:    cita.clientes!.nombre,
        negocioNombre:    cita.perfiles_negocio.nombre_negocio,
        negocioLogo:      cita.perfiles_negocio.logo_url,
        servicioNombre:   cita.servicios.nombre,
        duracionMinutos:  cita.servicios.duracion_minutos,
        fecha:            fechaDesdeIso(cita.fecha_hora_inicio),
        hora:             horaDesdeIso(cita.fecha_hora_inicio),
        tipo:             '2h',
      })

      await supabase
        .from('citas')
        .update({ recordatorio_2h_enviado: true })
        .eq('id', cita.id)

      enviados2++
    } catch (err) {
      console.error(`[cron] Error recordatorio 2h cita ${cita.id}:`, err)
    }
  }

  console.log(`[cron/recordatorios] 24h: ${enviados24} enviados | 2h: ${enviados2} enviados`)

  return NextResponse.json({
    ok: true,
    enviados: { '24h': enviados24, '2h': enviados2 },
    timestamp: new Date().toISOString(),
  })
}
