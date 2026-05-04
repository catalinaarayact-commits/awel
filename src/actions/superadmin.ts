'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  EstadoCuenta,
  MetricasSuperadmin,
  NegocioConEmail,
  PerfilNegocio,
} from '@/types/database'

// ─── Guard: verificar que el caller es superadmin ────────────────────────────

async function assertSuperadmin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data } = await supabase
    .from('roles_usuario')
    .select('role')
    .eq('id', user.id)
    .single()

  if (data?.role !== 'superadmin') throw new Error('Acceso denegado')
}

// ─── Métricas generales ──────────────────────────────────────────────────────

export async function getMetricasSuperadmin(): Promise<MetricasSuperadmin> {
  await assertSuperadmin()
  const supabase = await createClient()

  const [{ count: totalNegocios }, { data: porEstado }, { count: totalCitas }] =
    await Promise.all([
      supabase
        .from('perfiles_negocio')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('perfiles_negocio')
        .select('estado_cuenta'),
      supabase
        .from('citas')
        .select('*', { count: 'exact', head: true }),
    ])

  const estados = (porEstado ?? []) as { estado_cuenta: EstadoCuenta }[]
  const activos    = estados.filter(r => r.estado_cuenta === 'activo').length
  const suspendidos = estados.filter(r => r.estado_cuenta === 'suspendido').length
  const trials     = estados.filter(r => r.estado_cuenta === 'trial').length

  return {
    totalNegocios: totalNegocios ?? 0,
    activos,
    suspendidos,
    trials,
    totalCitas: totalCitas ?? 0,
  }
}

// ─── Listar negocios con email ───────────────────────────────────────────────
// Combina perfiles_negocio con auth.admin.listUsers() para obtener el email.
// Usamos el service client porque auth.admin requiere service_role.

export async function getNegociosConEmail(): Promise<NegocioConEmail[]> {
  await assertSuperadmin()
  const service = createServiceClient()

  const [{ data: perfiles }, { data: usersData }] = await Promise.all([
    service
      .from('perfiles_negocio')
      .select('*')
      .order('created_at', { ascending: false }),
    service.auth.admin.listUsers({ perPage: 1000 }),
  ])

  if (!perfiles) return []

  const emailMap = new Map<string, string>(
    (usersData?.users ?? []).map((u: { id: string; email?: string }) => [u.id, u.email ?? ''])
  )

  return (perfiles as PerfilNegocio[]).map(p => ({
    ...p,
    email: emailMap.get(p.user_id) ?? '—',
  }))
}

// ─── Gestionar negocio: cambiar estado + registrar pago ─────────────────────

export interface GestionarNegocioInput {
  negocioId: string
  estadoCuenta: EstadoCuenta
  fechaVencimiento: string | null    // YYYY-MM-DD o null
  // Pago opcional (solo si se registra uno)
  montoPagado?: number | null
  metodoPago?: string | null
  notasSuperadmin?: string | null
}

export async function gestionarNegocioAction(
  input: GestionarNegocioInput
): Promise<ActionResult> {
  try {
    await assertSuperadmin()
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const service = createServiceClient()

  // 1. Actualizar estado y fecha de vencimiento en perfiles_negocio
  const { error: updateError } = await service
    .from('perfiles_negocio')
    .update({
      estado_cuenta: input.estadoCuenta,
      fecha_vencimiento_suscripcion: input.fechaVencimiento ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.negocioId)

  if (updateError) {
    return { ok: false, error: `Error al actualizar el negocio: ${updateError.message}` }
  }

  // 2. Registrar pago si se proporcionaron datos de pago
  if (input.montoPagado && input.montoPagado > 0 && input.metodoPago) {
    const { error: pagoError } = await service
      .from('pagos_suscripcion')
      .insert({
        negocio_id: input.negocioId,
        fecha_pago: new Date().toISOString().slice(0, 10), // YYYY-MM-DD UTC
        monto_pagado: input.montoPagado,
        metodo_pago: input.metodoPago,
        notas_superadmin: input.notasSuperadmin ?? null,
      })

    if (pagoError) {
      // El estado ya se actualizó; registramos el error pero no revertimos
      return {
        ok: false,
        error: `Estado actualizado pero falló el registro del pago: ${pagoError.message}`,
      }
    }
  }

  revalidatePath('/superadmin')
  revalidatePath('/superadmin/negocios')
  return { ok: true }
}
