'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { enviarEmailCancelacion, enviarEmailSlotLiberado } from '@/lib/email'
import { computeChurnRisk } from '@/lib/churn'
import type { ActionResult, PersonalizacionNegocio, Servicio, ServicioAddon, CitaConDetalle, MetricasAgenda, EstadoCita, HorarioAtencion, ClienteConStats, CitaDelCliente, CampanaClima } from '@/types/database'

// ─── Guard: obtener el negocio del usuario autenticado ───────────────────────

async function getNegocioDelUsuario() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('No autenticado')

  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles_negocio')
    .select('id, nombre_negocio, logo_url, portada_url, color_primario, texto_bienvenida, slug, estado_cuenta')
    .eq('user_id', user.id)
    .single()

  if (perfilError || !perfil) throw new Error('Negocio no encontrado')
  return { user, perfil }
}

// ─── Personalización ─────────────────────────────────────────────────────────

export async function getPersonalizacion(): Promise<PersonalizacionNegocio> {
  const { perfil } = await getNegocioDelUsuario()
  return {
    id:               perfil.id,
    nombre_negocio:   perfil.nombre_negocio,
    logo_url:         perfil.logo_url,
    portada_url:      perfil.portada_url ?? null,
    color_primario:   perfil.color_primario ?? '#D98CF4',
    texto_bienvenida: perfil.texto_bienvenida,
    slug:             perfil.slug,
  }
}

export async function guardarPersonalizacionAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  let negocioId: string
  try {
    const { perfil } = await getNegocioDelUsuario()
    negocioId = perfil.id
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const colorPrimario   = (formData.get('color_primario') as string)?.trim()
  const textoBienvenida = (formData.get('texto_bienvenida') as string)?.trim()

  if (!colorPrimario || !/^#[0-9A-Fa-f]{6}$/.test(colorPrimario)) {
    return { ok: false, error: 'El color debe ser un hex válido (ej. #D98CF4).' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('perfiles_negocio')
    .update({ color_primario: colorPrimario, texto_bienvenida: textoBienvenida || null, updated_at: new Date().toISOString() })
    .eq('id', negocioId)

  if (error) return { ok: false, error: `Error al guardar: ${error.message}` }

  revalidatePath('/dashboard/personalizacion')
  return { ok: true }
}

// ─── Upload helpers ───────────────────────────────────────────────────────────

const ALLOWED_EXT = ['png', 'jpg', 'jpeg', 'webp']
const MAX_MB = 3

function validateImageFile(file: File | null): string | null {
  if (!file || file.size === 0) return 'No se recibió ningún archivo.'
  if (file.size > MAX_MB * 1024 * 1024) return `El archivo no puede superar ${MAX_MB} MB.`
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXT.includes(ext)) return 'Formato no permitido. Usa PNG, JPG o WEBP.'
  return null
}

async function uploadToStorage(
  service: ReturnType<typeof createServiceClient>,
  bucket: string,
  path: string,
  file: File
): Promise<{ publicUrl: string } | { error: string }> {
  const { error } = await service.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: true })
  if (error) return { error: error.message }
  const { data: { publicUrl } } = service.storage.from(bucket).getPublicUrl(path)
  return { publicUrl }
}

// ─── Upload logo ─────────────────────────────────────────────────────────────

export async function uploadLogoAction(
  _prevState: ActionResult<string>,
  formData: FormData
): Promise<ActionResult<string>> {
  let negocioId: string
  try {
    const { perfil } = await getNegocioDelUsuario()
    negocioId = perfil.id
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const file = formData.get('logo') as File | null
  const validationError = validateImageFile(file)
  if (validationError) return { ok: false, error: validationError }

  const ext = file!.name.split('.').pop()!.toLowerCase()
  const service = createServiceClient()
  const result = await uploadToStorage(service, 'logos', `${negocioId}/logo.${ext}`, file!)
  if ('error' in result) return { ok: false, error: `Error al subir: ${result.error}` }

  const { error } = await service.from('perfiles_negocio')
    .update({ logo_url: result.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', negocioId)

  if (error) return { ok: false, error: 'Logo subido pero falló la actualización.' }
  revalidatePath('/dashboard/personalizacion')
  return { ok: true, data: result.publicUrl }
}

// ─── Upload portada ───────────────────────────────────────────────────────────

export async function uploadPortadaAction(
  _prevState: ActionResult<string>,
  formData: FormData
): Promise<ActionResult<string>> {
  let negocioId: string
  try {
    const { perfil } = await getNegocioDelUsuario()
    negocioId = perfil.id
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const file = formData.get('portada') as File | null
  const validationError = validateImageFile(file)
  if (validationError) return { ok: false, error: validationError }

  const ext = file!.name.split('.').pop()!.toLowerCase()
  const service = createServiceClient()
  const result = await uploadToStorage(service, 'logos', `${negocioId}/portada.${ext}`, file!)
  if ('error' in result) return { ok: false, error: `Error al subir: ${result.error}` }

  const { error } = await service.from('perfiles_negocio')
    .update({ portada_url: result.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', negocioId)

  if (error) return { ok: false, error: 'Portada subida pero falló la actualización.' }
  revalidatePath('/dashboard/personalizacion')
  return { ok: true, data: result.publicUrl }
}

// ─── Servicios ────────────────────────────────────────────────────────────────

export async function getServiciosNegocio(): Promise<Servicio[]> {
  const { perfil } = await getNegocioDelUsuario()
  const supabase = await createClient()
  const { data } = await supabase
    .from('servicios')
    .select('*')
    .eq('negocio_id', perfil.id)
    .order('nombre')
  return data ?? []
}

export async function crearServicioAction(
  _prevState: ActionResult<Servicio>,
  formData: FormData
): Promise<ActionResult<Servicio>> {
  let negocioId: string
  try {
    const { perfil } = await getNegocioDelUsuario()
    negocioId = perfil.id
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const nombre   = (formData.get('nombre') as string)?.trim()
  const desc     = (formData.get('descripcion') as string)?.trim()
  const duracion = parseInt(formData.get('duracion_minutos') as string)
  const precio   = parseInt(formData.get('precio') as string)

  if (!nombre) return { ok: false, error: 'El nombre es obligatorio.' }
  if (isNaN(duracion) || duracion < 5) return { ok: false, error: 'Duración mínima 5 minutos.' }
  if (isNaN(precio) || precio < 0) return { ok: false, error: 'Precio inválido.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('servicios')
    .insert({ negocio_id: negocioId, nombre, descripcion: desc || null, duracion_minutos: duracion, precio, activo: true })
    .select()
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Error al crear el servicio.' }
  revalidatePath('/dashboard/servicios')
  return { ok: true, data }
}

export async function editarServicioAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    await getNegocioDelUsuario()
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const id       = formData.get('id') as string
  const nombre   = (formData.get('nombre') as string)?.trim()
  const desc     = (formData.get('descripcion') as string)?.trim()
  const duracion = parseInt(formData.get('duracion_minutos') as string)
  const precio   = parseInt(formData.get('precio') as string)

  if (!id || !nombre) return { ok: false, error: 'Datos incompletos.' }
  if (isNaN(duracion) || duracion < 5) return { ok: false, error: 'Duración mínima 5 minutos.' }
  if (isNaN(precio) || precio < 0) return { ok: false, error: 'Precio inválido.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('servicios')
    .update({ nombre, descripcion: desc || null, duracion_minutos: duracion, precio, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/servicios')
  return { ok: true }
}

export async function toggleServicioAction(servicioId: string, activo: boolean): Promise<ActionResult> {
  try {
    await getNegocioDelUsuario()
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('servicios')
    .update({ activo, updated_at: new Date().toISOString() })
    .eq('id', servicioId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/servicios')
  return { ok: true }
}

export async function eliminarServicioAction(servicioId: string): Promise<ActionResult> {
  let negocioId: string
  try {
    const { perfil } = await getNegocioDelUsuario()
    negocioId = perfil.id
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('servicios')
    .delete()
    .eq('id', servicioId)
    .eq('negocio_id', negocioId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/servicios')
  return { ok: true }
}

export async function uploadFotoServicioAction(
  _prevState: ActionResult<string>,
  formData: FormData
): Promise<ActionResult<string>> {
  let negocioId: string
  try {
    const { perfil } = await getNegocioDelUsuario()
    negocioId = perfil.id
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const servicioId = formData.get('servicio_id') as string
  if (!servicioId) return { ok: false, error: 'ID de servicio requerido.' }

  const file = formData.get('foto') as File | null
  const validationError = validateImageFile(file)
  if (validationError) return { ok: false, error: validationError }

  const ext = file!.name.split('.').pop()!.toLowerCase()
  const service = createServiceClient()
  const result = await uploadToStorage(service, 'logos', `${negocioId}/servicios/${servicioId}.${ext}`, file!)
  if ('error' in result) return { ok: false, error: `Error al subir: ${result.error}` }

  const { error } = await service.from('servicios')
    .update({ foto_url: result.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', servicioId)
    .eq('negocio_id', negocioId)

  if (error) return { ok: false, error: 'Foto subida pero falló la actualización.' }
  revalidatePath('/dashboard/servicios')
  return { ok: true, data: result.publicUrl }
}

// ─── Agenda ───────────────────────────────────────────────────────────────────

export async function getCitasAgenda(): Promise<CitaConDetalle[]> {
  const { perfil } = await getNegocioDelUsuario()
  const supabase = await createClient()
  const { data } = await supabase
    .from('citas')
    .select(`
      *,
      cliente:clientes(nombre, email, telefono),
      servicio:servicios(nombre, duracion_minutos)
    `)
    .eq('negocio_id', perfil.id)
    .order('fecha_hora_inicio', { ascending: true })
  return (data as unknown as CitaConDetalle[]) ?? []
}

export async function getMetricasAgenda(): Promise<MetricasAgenda> {
  const { perfil } = await getNegocioDelUsuario()
  const supabase = await createClient()

  const hoyInicio = new Date(); hoyInicio.setHours(0, 0, 0, 0)
  const hoyFin    = new Date(); hoyFin.setHours(23, 59, 59, 999)
  const semanaFin = new Date(hoyInicio); semanaFin.setDate(semanaFin.getDate() + 7)

  const [resHoy, resPendientes, resSemana] = await Promise.all([
    supabase
      .from('citas')
      .select('id', { count: 'exact', head: true })
      .eq('negocio_id', perfil.id)
      .in('estado', ['pendiente', 'confirmada'])
      .gte('fecha_hora_inicio', hoyInicio.toISOString())
      .lte('fecha_hora_inicio', hoyFin.toISOString()),
    supabase
      .from('citas')
      .select('id', { count: 'exact', head: true })
      .eq('negocio_id', perfil.id)
      .eq('estado', 'pendiente'),
    supabase
      .from('citas')
      .select('id', { count: 'exact', head: true })
      .eq('negocio_id', perfil.id)
      .in('estado', ['pendiente', 'confirmada'])
      .gte('fecha_hora_inicio', hoyInicio.toISOString())
      .lte('fecha_hora_inicio', semanaFin.toISOString()),
  ])

  return {
    citasHoy:       resHoy.count ?? 0,
    citasPendientes: resPendientes.count ?? 0,
    citasSemana:    resSemana.count ?? 0,
  }
}

export async function actualizarEstadoCitaAction(
  citaId: string,
  estado: EstadoCita
): Promise<ActionResult> {
  let perfil: Awaited<ReturnType<typeof getNegocioDelUsuario>>['perfil']
  try {
    const result = await getNegocioDelUsuario()
    perfil = result.perfil
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('citas')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', citaId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard')

  // Emails y notificaciones de lista de espera al cancelar
  if (estado === 'cancelada') {
    try {
      const { data: cita } = await supabase
        .from('citas')
        .select('fecha_hora_inicio, negocio_id, servicio_id, cliente:clientes(nombre, email), servicio:servicios(nombre)')
        .eq('id', citaId)
        .single()

      const cliente = cita?.cliente as unknown as { nombre: string; email: string | null } | null
      const servicio = cita?.servicio as unknown as { nombre: string } | null

      if (cita) {
        const d    = new Date(cita.fecha_hora_inicio)
        const yy   = d.getFullYear()
        const mo   = String(d.getMonth() + 1).padStart(2, '0')
        const dd   = String(d.getDate()).padStart(2, '0')
        const hh   = String(d.getUTCHours()).padStart(2, '0')
        const mm   = String(d.getUTCMinutes()).padStart(2, '0')
        const fecha = `${yy}-${mo}-${dd}`
        const hora  = `${hh}:${mm}`

        // 1. Email de cancelación al cliente
        if (cliente?.email && servicio) {
          await enviarEmailCancelacion({
            to:             cliente.email,
            clienteNombre:  cliente.nombre,
            negocioNombre:  perfil.nombre_negocio,
            negocioLogo:    perfil.logo_url,
            servicioNombre: servicio.nombre,
            fecha,
            hora,
          })
        }

        // 2. Notificar lista de espera del mismo negocio + servicio + fecha
        const service = createServiceClient()
        const { data: espera } = await service
          .from('lista_espera')
          .select('id, clientes(nombre, email)')
          .eq('negocio_id', cita.negocio_id)
          .eq('servicio_id', cita.servicio_id)
          .eq('fecha_deseada', fecha)
          .eq('estado', 'esperando')

        if (espera && espera.length > 0 && servicio) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://awelapp.cl'
          const urlReserva = `${siteUrl}/${perfil.slug}`

          for (const entrada of espera) {
            const c = entrada.clientes as unknown as { nombre: string; email: string | null } | null
            if (!c?.email) continue
            try {
              await enviarEmailSlotLiberado({
                to:             c.email,
                clienteNombre:  c.nombre,
                negocioNombre:  perfil.nombre_negocio,
                negocioLogo:    perfil.logo_url,
                servicioNombre: servicio.nombre,
                fecha,
                hora,
                urlReserva,
              })
              await service
                .from('lista_espera')
                .update({ estado: 'notificado', updated_at: new Date().toISOString() })
                .eq('id', entrada.id)
            } catch { /* sigue con el siguiente */ }
          }
        }
      }
    } catch {
      // Fallos de email nunca revierten el cambio de estado
    }
  }

  return { ok: true }
}

// ─── Horarios de atención ─────────────────────────────────────────────────────

export async function getHorariosNegocio(): Promise<HorarioAtencion[]> {
  const { perfil } = await getNegocioDelUsuario()
  const supabase = await createClient()
  const { data } = await supabase
    .from('horarios_atencion')
    .select('*')
    .eq('negocio_id', perfil.id)
    .order('dia_semana')
  return data ?? []
}

export interface HorarioInput {
  dia_semana: number
  hora_apertura: string  // "HH:mm"
  hora_cierre: string    // "HH:mm"
  activo: boolean
  modo: 'rango' | 'especifico'
  slots_especificos: string[] | null  // ["HH:mm", …] sólo cuando modo = 'especifico'
}

export async function guardarHorariosAction(horarios: HorarioInput[]): Promise<ActionResult> {
  let negocioId: string
  try {
    const { perfil } = await getNegocioDelUsuario()
    negocioId = perfil.id
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  // Validaciones básicas
  for (const h of horarios) {
    if (h.activo) {
      if (h.modo === 'rango') {
        const [ah, am] = h.hora_apertura.split(':').map(Number)
        const [ch, cm] = h.hora_cierre.split(':').map(Number)
        if (isNaN(ah) || isNaN(ch)) return { ok: false, error: 'Formato de hora inválido.' }
        if (ah * 60 + am >= ch * 60 + cm) return { ok: false, error: 'La hora de cierre debe ser posterior a la apertura.' }
      } else if (h.modo === 'especifico') {
        if (!h.slots_especificos || h.slots_especificos.length === 0) {
          return { ok: false, error: 'Debes agregar al menos un horario específico.' }
        }
      }
    }
  }

  const supabase = await createClient()
  const rows = horarios.map(h => ({
    negocio_id:        negocioId,
    dia_semana:        h.dia_semana,
    hora_apertura:     h.hora_apertura,
    hora_cierre:       h.hora_cierre,
    activo:            h.activo,
    modo:              h.modo,
    slots_especificos: h.modo === 'especifico' ? h.slots_especificos : null,
  }))

  const { error } = await supabase
    .from('horarios_atencion')
    .upsert(rows, { onConflict: 'negocio_id,dia_semana' })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/horarios')
  return { ok: true }
}

// ─── Clientes ─────────────────────────────────────────────────────────────────

export async function getClientesDirectorio(): Promise<ClienteConStats[]> {
  const { perfil } = await getNegocioDelUsuario()
  const supabase = await createClient()

  const [{ data: clientes }, { data: citas }] = await Promise.all([
    supabase
      .from('clientes')
      .select('*')
      .eq('negocio_id', perfil.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('citas')
      .select('cliente_id, fecha_hora_inicio')
      .eq('negocio_id', perfil.id),
  ])

  // Compute per-client stats in JS (avoids N+1 and unsupported aggregate syntax)
  const statsMap = new Map<string, { total: number; ultima: string; fechas: string[] }>()
  for (const c of citas ?? []) {
    const s = statsMap.get(c.cliente_id)
    if (!s) {
      statsMap.set(c.cliente_id, { total: 1, ultima: c.fecha_hora_inicio, fechas: [c.fecha_hora_inicio] })
    } else {
      s.total++
      s.fechas.push(c.fecha_hora_inicio)
      if (c.fecha_hora_inicio > s.ultima) s.ultima = c.fecha_hora_inicio
    }
  }

  const hoy = new Date()

  return (clientes ?? []).map(c => {
    const stats  = statsMap.get(c.id)
    const churn  = stats ? computeChurnRisk(stats.fechas, hoy) : null
    return {
      ...c,
      totalCitas: stats?.total ?? 0,
      ultimaCita: stats?.ultima ?? null,
      churnRisk:  churn?.isAtRisk ?? false,
    }
  })
}

export async function getClienteCitas(clienteId: string): Promise<CitaDelCliente[]> {
  const { perfil } = await getNegocioDelUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('citas')
    .select('id, fecha_hora_inicio, fecha_hora_fin, estado, servicio:servicios(nombre, duracion_minutos)')
    .eq('negocio_id', perfil.id)
    .eq('cliente_id', clienteId)
    .order('fecha_hora_inicio', { ascending: false })

  return (data ?? []) as unknown as CitaDelCliente[]
}

// ─── Add-ons / Sub-servicios ──────────────────────────────────────────────────

export async function getAddonsAction(servicioId: string): Promise<ServicioAddon[]> {
  const { perfil } = await getNegocioDelUsuario()
  const supabase = await createClient()
  const { data } = await supabase
    .from('servicios_addon')
    .select('*')
    .eq('servicio_id', servicioId)
    .eq('negocio_id', perfil.id)
    .order('created_at')
  return (data ?? []) as ServicioAddon[]
}

export async function crearAddonAction(
  addon: { servicioId: string; nombre: string; descripcion?: string; precio: number; duracionMinutos: number }
): Promise<ActionResult> {
  const { perfil } = await getNegocioDelUsuario()
  const supabase = await createClient()

  if (!addon.nombre.trim()) return { ok: false, error: 'El nombre es obligatorio.' }
  if (addon.precio < 0)      return { ok: false, error: 'El precio no puede ser negativo.' }
  if (addon.duracionMinutos < 0) return { ok: false, error: 'La duración no puede ser negativa.' }

  const { error } = await supabase
    .from('servicios_addon')
    .insert({
      servicio_id:      addon.servicioId,
      negocio_id:       perfil.id,
      nombre:           addon.nombre.trim(),
      descripcion:      addon.descripcion?.trim() || null,
      precio:           addon.precio,
      duracion_minutos: addon.duracionMinutos,
    })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/servicios')
  return { ok: true }
}

export async function eliminarAddonAction(addonId: string): Promise<ActionResult> {
  await getNegocioDelUsuario() // guard
  const supabase = await createClient()
  const { error } = await supabase.from('servicios_addon').delete().eq('id', addonId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/servicios')
  return { ok: true }
}

export async function toggleAddonAction(addonId: string, activo: boolean): Promise<ActionResult> {
  await getNegocioDelUsuario()
  const supabase = await createClient()
  const { error } = await supabase
    .from('servicios_addon')
    .update({ activo, updated_at: new Date().toISOString() })
    .eq('id', addonId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// ─── Campañas por clima ───────────────────────────────────────────────────────

export interface ConfigClima {
  ciudad:               string | null
  campana_lluvia_activa: boolean
  campana_calor_activa:  boolean
}

export async function getConfigClima(): Promise<ConfigClima> {
  const { perfil } = await getNegocioDelUsuario()
  const supabase   = await createClient()

  const { data } = await supabase
    .from('perfiles_negocio')
    .select('ciudad, campana_lluvia_activa, campana_calor_activa')
    .eq('id', perfil.id)
    .single()

  return {
    ciudad:               data?.ciudad ?? null,
    campana_lluvia_activa: data?.campana_lluvia_activa ?? false,
    campana_calor_activa:  data?.campana_calor_activa  ?? false,
  }
}

export async function guardarConfigClimaAction(
  config: ConfigClima
): Promise<ActionResult> {
  let negocioId: string
  try {
    const { perfil } = await getNegocioDelUsuario()
    negocioId = perfil.id
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('perfiles_negocio')
    .update({
      ciudad:               config.ciudad?.trim() || null,
      campana_lluvia_activa: config.campana_lluvia_activa,
      campana_calor_activa:  config.campana_calor_activa,
      updated_at:           new Date().toISOString(),
    })
    .eq('id', negocioId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/campanas')
  return { ok: true }
}

export async function getCampanasHistorial(): Promise<CampanaClima[]> {
  const { perfil } = await getNegocioDelUsuario()
  const supabase   = await createClient()

  const { data } = await supabase
    .from('campanas_clima')
    .select('*')
    .eq('negocio_id', perfil.id)
    .order('enviada_at', { ascending: false })
    .limit(20)

  return (data ?? []) as CampanaClima[]
}
