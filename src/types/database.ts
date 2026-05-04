// Tipos derivados del schema supabase/schema.sql
// Actualizar aquí si se modifica el schema.

export type RolUsuario = 'superadmin' | 'admin_negocio'
export type EstadoCuenta = 'trial' | 'activo' | 'suspendido'
export type EstadoCita = 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
export type EstadoEspera = 'esperando' | 'notificado' | 'confirmado' | 'cancelado'
export type MetodoPago = 'Flow' | 'Transferencia' | string

export interface PerfilNegocio {
  id: string
  user_id: string
  nombre_negocio: string
  slug: string
  logo_url: string | null
  color_primario: string
  estado_cuenta: EstadoCuenta
  fecha_vencimiento_suscripcion: string | null  // DATE como ISO string YYYY-MM-DD
  texto_bienvenida: string | null               // Migración 001
  created_at: string
  updated_at: string
}

export interface NegocioConEmail extends PerfilNegocio {
  email: string
}

// Subset de PerfilNegocio que el admin puede editar desde el dashboard
export interface PersonalizacionNegocio {
  id: string
  nombre_negocio: string
  logo_url: string | null
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
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  negocio_id: string
  rut: string
  nombre: string
  email: string | null
  telefono: string | null
  puntos_fidelidad: number
  notas_internas: string | null
  ultimo_contacto: string | null
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
