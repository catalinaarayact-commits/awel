/**
 * GET /api/cron/clima
 *
 * Ejecutado cada día a las 08:00 hora Chile (11:00 UTC) por Vercel Cron.
 * Consulta el clima de cada negocio activo y envía campañas de email
 * cuando se cumplen las condiciones configuradas.
 *
 * Condiciones:
 *   lluvia → weather.main en Rain / Drizzle / Thunderstorm
 *   calor  → temperatura >= 28 °C
 *
 * Cooldown: 7 días por (negocio, tipo_clima) — evita spam en semanas lluviosas.
 *
 * Protegido con Authorization: Bearer <CRON_SECRET>.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchClima } from '@/lib/clima'
import { enviarEmailCampanaClima } from '@/lib/email'

const DIAS_COOLDOWN  = 7
const BASE_URL       = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://awel.cl'

// ─── Tipos locales ─────────────────────────────────────────────────────────────

type NegocioRow = {
  id: string
  nombre_negocio: string
  logo_url: string | null
  slug: string
  ciudad: string
  campana_lluvia_activa: boolean
  campana_calor_activa: boolean
}

type ClienteRow = {
  id: string
  nombre: string
  email: string
}

type CampanaReciente = {
  tipo_clima: string
  enviada_at: string
}

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

  const supabase  = createServiceClient()
  const ahora     = new Date()
  const cooldown  = new Date(ahora.getTime() - DIAS_COOLDOWN * 24 * 60 * 60 * 1000).toISOString()

  // ── 1. Negocios activos con ciudad y al menos una campaña activa ─────────────
  const { data: negociosRaw } = await supabase
    .from('perfiles_negocio')
    .select('id, nombre_negocio, logo_url, slug, ciudad, campana_lluvia_activa, campana_calor_activa')
    .eq('estado_cuenta', 'activo')
    .not('ciudad', 'is', null)

  const negocios = ((negociosRaw ?? []) as NegocioRow[]).filter(
    n => n.ciudad && (n.campana_lluvia_activa || n.campana_calor_activa)
  )

  if (!negocios.length) {
    return NextResponse.json({ ok: true, procesados: 0, enviados: 0 })
  }

  // ── 2. Campañas enviadas recientemente (cooldown) ────────────────────────────
  const negocioIds = negocios.map(n => n.id)
  const { data: recientesRaw } = await supabase
    .from('campanas_clima')
    .select('negocio_id, tipo_clima, enviada_at')
    .in('negocio_id', negocioIds)
    .gte('enviada_at', cooldown)

  type RecienteRow = { negocio_id: string; tipo_clima: string; enviada_at: string }

  // Set de "negocio_id::tipo_clima" que ya están en cooldown
  const enCooldown = new Set(
    ((recientesRaw ?? []) as RecienteRow[]).map(r => `${r.negocio_id}::${r.tipo_clima}`)
  )

  let totalEnviados = 0

  // ── 3. Procesar negocio por negocio ──────────────────────────────────────────
  for (const negocio of negocios) {
    let resultado
    try {
      resultado = await fetchClima(negocio.ciudad)
    } catch (err) {
      console.error(`[cron/clima] Error consultando clima para ${negocio.ciudad}:`, err)
      continue
    }

    const { tipo, tempC } = resultado

    // Sin condición especial hoy
    if (!tipo) continue

    // Verificar que la campaña de este tipo esté activa en el negocio
    if (tipo === 'lluvia' && !negocio.campana_lluvia_activa) continue
    if (tipo === 'calor'  && !negocio.campana_calor_activa)  continue

    // Verificar cooldown
    if (enCooldown.has(`${negocio.id}::${tipo}`)) {
      console.log(`[cron/clima] ${negocio.nombre_negocio} — ${tipo} en cooldown, omitiendo.`)
      continue
    }

    // Obtener clientes con email del negocio
    const { data: clientesRaw } = await supabase
      .from('clientes')
      .select('id, nombre, email')
      .eq('negocio_id', negocio.id)
      .not('email', 'is', null)

    const clientes = (clientesRaw ?? []) as ClienteRow[]
    if (!clientes.length) continue

    // Enviar emails
    let enviados = 0
    for (const cliente of clientes) {
      if (!cliente.email) continue
      try {
        await enviarEmailCampanaClima({
          to:            cliente.email,
          clienteNombre: cliente.nombre,
          negocioNombre: negocio.nombre_negocio,
          negocioLogo:   negocio.logo_url,
          tipo,
          tempC,
          urlReserva:    `${BASE_URL}/${negocio.slug}`,
        })
        enviados++
      } catch (err) {
        console.error(`[cron/clima] Error enviando email a ${cliente.email}:`, err)
      }
    }

    // Registrar campaña en historial
    if (enviados > 0) {
      await supabase.from('campanas_clima').insert({
        negocio_id:           negocio.id,
        tipo_clima:           tipo,
        ciudad:               negocio.ciudad,
        temp_c:               tempC,
        clientes_notificados: enviados,
        enviada_at:           ahora.toISOString(),
      })
      totalEnviados += enviados
    }

    console.log(`[cron/clima] ${negocio.nombre_negocio} — ${tipo} (${tempC} °C): ${enviados} emails enviados`)
  }

  return NextResponse.json({
    ok: true,
    procesados: negocios.length,
    enviados: totalEnviados,
    timestamp: ahora.toISOString(),
  })
}
