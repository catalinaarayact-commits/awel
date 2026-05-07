'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { addMinutes, parseISO, getISODay } from 'date-fns'
import { calcularSlotsDisponibles } from '@/lib/booking-logic'
import { enviarEmailConfirmacion, enviarEmailConfirmacionEspera } from '@/lib/email'
import type { PerfilNegocio, Servicio, ServicioAddon, ActionResult, HorarioAtencion } from '@/types/database'

export async function getNegocioPorSlug(slug: string): Promise<PerfilNegocio | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('perfiles_negocio')
    .select('*')
    .eq('slug', slug)
    .eq('estado_cuenta', 'activo')
    .single()
  return data ?? null
}

export async function getServiciosActivos(negocioId: string): Promise<Servicio[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('servicios')
    .select('*')
    .eq('negocio_id', negocioId)
    .eq('activo', true)
    .order('nombre')
  return data ?? []
}

export async function getHorariosAtencion(negocioId: string): Promise<HorarioAtencion[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('horarios_atencion')
    .select('*')
    .eq('negocio_id', negocioId)
    .eq('activo', true)
  return data ?? []
}

export async function getHorasDisponibles(
  negocioId: string,
  servicioId: string,
  fecha: string, // YYYY-MM-DD
  duracionOverride?: number // duración total incluyendo add-ons seleccionados
): Promise<string[]> {
  const supabase = await createClient()

  const { data: servicio } = await supabase
    .from('servicios')
    .select('duracion_minutos')
    .eq('id', servicioId)
    .single()
  if (!servicio) return []

  const diaSemana = getISODay(parseISO(fecha)) // 1=Mon..7=Sun

  const { data: horario } = await supabase
    .from('horarios_atencion')
    .select('hora_apertura, hora_cierre, modo, slots_especificos')
    .eq('negocio_id', negocioId)
    .eq('dia_semana', diaSemana)
    .eq('activo', true)
    .single()
  if (!horario) return []

  const [y, mo, d] = fecha.split('-').map(Number)
  const diaInicio  = new Date(y, mo - 1, d, 0, 0, 0, 0)
  const diaFin     = new Date(y, mo - 1, d, 23, 59, 59, 999)

  const { data: citasExistentes } = await supabase
    .from('citas')
    .select('fecha_hora_inicio, fecha_hora_fin')
    .eq('negocio_id', negocioId)
    .in('estado', ['pendiente', 'confirmada'])
    .gte('fecha_hora_inicio', diaInicio.toISOString())
    .lte('fecha_hora_inicio', diaFin.toISOString())

  const [aperturaH, aperturaM] = horario.hora_apertura.split(':').map(Number)
  const [cierreH, cierreM]     = horario.hora_cierre.split(':').map(Number)

  const ocupadasMs = (citasExistentes ?? []).map(c => ({
    inicio: new Date(c.fecha_hora_inicio).getTime(),
    fin:    new Date(c.fecha_hora_fin).getTime(),
  }))

  return calcularSlotsDisponibles({
    fecha,
    aperturaH, aperturaM,
    cierreH, cierreM,
    duracionMinutos: duracionOverride ?? servicio.duracion_minutos,
    ocupadas: ocupadasMs,
    slotsEspecificos: horario.modo === 'especifico' ? (horario.slots_especificos as string[] | null) : null,
  })
}

export interface DatosCitaPublica {
  negocioId: string
  servicioId: string
  fecha: string  // YYYY-MM-DD
  hora: string   // HH:mm
  nombre: string
  email: string
  telefono?: string
  notasCliente?: string
  duracionTotal?: number     // servicio base + add-ons seleccionados
  addonsNombres?: string[]   // para mostrar en notas internas
}

// ─── Add-ons públicos ─────────────────────────────────────────────────────────

export async function getAddonsServicio(servicioId: string): Promise<ServicioAddon[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('servicios_addon')
    .select('*')
    .eq('servicio_id', servicioId)
    .eq('activo', true)
    .order('precio')
  return (data ?? []) as ServicioAddon[]
}

export async function crearCitaPublicaAction(datos: DatosCitaPublica): Promise<ActionResult> {
  const service = createServiceClient()

  const { data: servicio } = await service
    .from('servicios')
    .select('nombre, duracion_minutos, activo')
    .eq('id', datos.servicioId)
    .eq('negocio_id', datos.negocioId)
    .single()
  if (!servicio?.activo) return { ok: false, error: 'Servicio no disponible.' }

  const { data: staff } = await service
    .from('staff')
    .select('id')
    .eq('negocio_id', datos.negocioId)
    .eq('activo', true)
    .limit(1)
    .single()
  if (!staff) return { ok: false, error: 'No hay profesionales disponibles en este momento.' }

  let clienteId: string
  const { data: clienteExistente } = await service
    .from('clientes')
    .select('id')
    .eq('negocio_id', datos.negocioId)
    .eq('email', datos.email)
    .maybeSingle()

  if (clienteExistente) {
    clienteId = clienteExistente.id
  } else {
    const { data: nuevoCliente, error: errCliente } = await service
      .from('clientes')
      .insert({
        negocio_id: datos.negocioId,
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono ?? null,
      })
      .select('id')
      .single()
    if (errCliente || !nuevoCliente) return { ok: false, error: 'Error al registrar cliente.' }
    clienteId = nuevoCliente.id
  }

  const [h, m] = datos.hora.split(':').map(Number)
  const [fy, fmo, fd] = datos.fecha.split('-').map(Number)
  const inicio = new Date(fy, fmo - 1, fd, h, m, 0, 0) // hora local correcta
  const duracion = datos.duracionTotal ?? servicio.duracion_minutos
  const fin = addMinutes(inicio, duracion)

  // Verify slot is still free before inserting
  const { data: conflicto } = await service
    .from('citas')
    .select('id')
    .eq('negocio_id', datos.negocioId)
    .in('estado', ['pendiente', 'confirmada'])
    .lt('fecha_hora_inicio', fin.toISOString())
    .gt('fecha_hora_fin', inicio.toISOString())
    .limit(1)
    .maybeSingle()

  if (conflicto) return { ok: false, error: 'Este horario ya no está disponible. Por favor elige otro.' }

  const { error } = await service.from('citas').insert({
    negocio_id: datos.negocioId,
    cliente_id: clienteId,
    servicio_id: datos.servicioId,
    staff_id: staff.id,
    fecha_hora_inicio: inicio.toISOString(),
    fecha_hora_fin: fin.toISOString(),
    estado: 'pendiente',
    notas_cliente: [
      datos.notasCliente,
      datos.addonsNombres?.length ? `Extras: ${datos.addonsNombres.join(', ')}` : null,
    ].filter(Boolean).join('\n') || null,
  })

  if (error) return { ok: false, error: 'No se pudo agendar la cita. Intenta nuevamente.' }

  // Enviar email de confirmación — fallo no bloquea la reserva
  if (datos.email) {
    try {
      const { data: negocio } = await service
        .from('perfiles_negocio')
        .select('nombre_negocio, logo_url')
        .eq('id', datos.negocioId)
        .single()

      if (negocio) {
        await enviarEmailConfirmacion({
          to:               datos.email,
          clienteNombre:    datos.nombre,
          negocioNombre:    negocio.nombre_negocio,
          negocioLogo:      negocio.logo_url,
          servicioNombre:   servicio.nombre,
          duracionMinutos:  servicio.duracion_minutos,
          fecha:            datos.fecha,
          hora:             datos.hora,
        })
      }
    } catch {
      // Email failure never cancels a successful booking
    }
  }

  return { ok: true }
}

// ─── Lista de espera ──────────────────────────────────────────────────────────

export interface DatosListaEspera {
  negocioId:  string
  servicioId: string
  fecha:      string  // YYYY-MM-DD
  nombre:     string
  email:      string
  telefono?:  string
}

export async function unirseListaEsperaAction(datos: DatosListaEspera): Promise<ActionResult> {
  const service = createServiceClient()

  // Verificar que el negocio y servicio existen
  const { data: negocio } = await service
    .from('perfiles_negocio')
    .select('nombre_negocio, logo_url')
    .eq('id', datos.negocioId)
    .single()
  if (!negocio) return { ok: false, error: 'Negocio no encontrado.' }

  const { data: servicio } = await service
    .from('servicios')
    .select('nombre')
    .eq('id', datos.servicioId)
    .eq('activo', true)
    .single()
  if (!servicio) return { ok: false, error: 'Servicio no disponible.' }

  // Crear o encontrar cliente
  let clienteId: string
  const { data: clienteExistente } = await service
    .from('clientes')
    .select('id')
    .eq('negocio_id', datos.negocioId)
    .eq('email', datos.email)
    .maybeSingle()

  if (clienteExistente) {
    clienteId = clienteExistente.id
  } else {
    const { data: nuevoCliente, error: errCliente } = await service
      .from('clientes')
      .insert({ negocio_id: datos.negocioId, nombre: datos.nombre, email: datos.email, telefono: datos.telefono ?? null })
      .select('id')
      .single()
    if (errCliente || !nuevoCliente) return { ok: false, error: 'Error al registrar cliente.' }
    clienteId = nuevoCliente.id
  }

  // Verificar si ya está en la lista para ese día y servicio
  const { data: yaEspera } = await service
    .from('lista_espera')
    .select('id')
    .eq('negocio_id', datos.negocioId)
    .eq('cliente_id', clienteId)
    .eq('servicio_id', datos.servicioId)
    .eq('fecha_deseada', datos.fecha)
    .in('estado', ['esperando', 'notificado'])
    .maybeSingle()

  if (yaEspera) return { ok: false, error: 'Ya estás en la lista de espera para este día.' }

  // Insertar en lista_espera
  const { error: errEspera } = await service
    .from('lista_espera')
    .insert({
      negocio_id:    datos.negocioId,
      cliente_id:    clienteId,
      servicio_id:   datos.servicioId,
      fecha_deseada: datos.fecha,
      estado:        'esperando',
    })

  if (errEspera) return { ok: false, error: 'Error al unirse a la lista de espera.' }

  // Email de confirmación (no bloquea el éxito si falla)
  try {
    await enviarEmailConfirmacionEspera({
      to:             datos.email,
      clienteNombre:  datos.nombre,
      negocioNombre:  negocio.nombre_negocio,
      negocioLogo:    negocio.logo_url,
      servicioNombre: servicio.nombre,
      fecha:          datos.fecha,
    })
  } catch { /* silencioso */ }

  return { ok: true }
}
