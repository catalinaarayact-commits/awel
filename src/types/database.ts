// Tipos derivados del schema supabase/schema.sql
// Actualizar aquí si se modifica el schema.

export type RolUsuario = 'superadmin' | 'admin_negocio'
export type EstadoCuenta = 'trial' | 'activo' | 'suspendido'
export type EstadoCita = 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
export type EstadoEspera = 'esperando' | 'notificado' | 'confirmado' | 'cancelado'
export type MetodoPago = 'Flow' | 'Transferencia' | string

export type TipoClima = 'lluvia' | 'calor'

export interface PerfilNegocio {
  id: string
  user_id: string
  nombre_negocio: string
  slug: string
  logo_url: string | null
  portada_url: string | null                    // Migración 003
  color_primario: string
  estado_cuenta: EstadoCuenta
  fecha_vencimiento_suscripcion: string | null  // DATE como ISO string YYYY-MM-DD
  texto_bienvenida: string | null               // Migración 001
  ciudad: string | null                         // Migración 009
  campana_lluvia_activa: boolean                // Migración 009
  campana_calor_activa: boolean                 // Migración 009
  created_at: string
  updated_at: string
}

export interface CampanaClima {
  id: string
  negocio_id: string
  tipo_clima: TipoClima
  ciudad: string
  temp_c: number | null
  clientes_notificados: number
  enviada_at: string
}

export interface NegocioConEmail extends PerfilNegocio {
  email: string
}

// Subset de PerfilNegocio que el admin puede editar desde el dashboard
export interface PersonalizacionNegocio {
  id: string
  nombre_negocio: string
  logo_url: string | null
  portada_url: string | null
  color_primario: string
  texto_bienvenida: string | null
  slug: string
}

export interface PagoSuscripcion {
  id: string
  negocio_id: string
  fecha_pago: string        // DATE ISO string
  monto_pagado: number
  metodo_pago: MetodoPago
  comprobante_url: string | null
  notas_superadmin: string | null
  created_at: string
}

export interface RolUsuarioRow {
  id: string
  role: RolUsuario
  created_at: string
}

export interface Staff {
  id: string
  negocio_id: string
  nombre: string
  email: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Servicio {
  id: string
  negocio_id: string
  nombre: string
  descripcion: string | null
  duracion_minutos: number
  precio: number
  foto_url: string | null   // Migración 003
  activo: boolean
  created_at: string
  updated_at: string
}

export interface ServicioAddon {
  id: string
  servicio_id: string
  negocio_id: string
  nombre: string
  descripcion: string | null
  precio: number           // CLP; 0 = incluido
  duracion_minutos: number // minutos extra al servicio base
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  negocio_id: string
  rut: string | null
  nombre: string
  email: string | null
  telefono: string | null
  puntos_fidelidad: number
  notas_internas: string | null
  ultimo_contacto: string | null
  ultimo_churn_email: string | null   // Migración 008
  created_at: string
  updated_at: string
}

export interface Cita {
  id: string
  negocio_id: string
  cliente_id: string
  servicio_id: string
  staff_id: string
  fecha_hora_inicio: string  // timestamptz ISO string (UTC)
  fecha_hora_fin: string
  estado: EstadoCita
  notas_cliente: string | null
  created_at: string
  updated_at: string
}

export interface HorarioAtencion {
  id: string
  negocio_id: string
  dia_semana: number  // 1=Lunes … 7=Domingo (ISO 8601)
  hora_apertura: string  // "HH:mm:ss"
  hora_cierre: string
  activo: boolean
  modo: 'rango' | 'especifico'
  slots_especificos: string[] | null  // ["HH:mm", …] cuando modo = 'especifico'
}

export interface ListaEspera {
  id: string
  negocio_id: string
  cliente_id: string
  servicio_id: string
  fecha_deseada: string   // DATE ISO string YYYY-MM-DD
  estado: EstadoEspera
  created_at: string
  updated_at: string
}

export interface CitaConDetalle extends Cita {
  cliente: { nombre: string; email: string | null; telefono: string | null }
  servicio: { nombre: string; duracion_minutos: number }
}

export interface MetricasAgenda {
  citasHoy: number
  citasPendientes: number
  citasSemana: number
}

export interface ClienteConStats extends Cliente {
  totalCitas: number
  ultimaCita: string | null  // ISO timestamp of most recent appointment
  churnRisk:  boolean        // true = cliente en riesgo de fuga (Migración 008)
}

export interface CitaDelCliente {
  id: string
  fecha_hora_inicio: string
  fecha_hora_fin: string
  estado: EstadoCita
  servicio: { nombre: string; duracion_minutos: number }
}

// ─── Tipos de respuesta para Server Actions ──────────────────────────────────

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

export interface MetricasSuperadmin {
  totalNegocios: number
  activos: number
  suspendidos: number
  trials: number
  totalCitas: number
}
