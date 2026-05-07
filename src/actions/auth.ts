'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { enviarEmailRecuperacion } from '@/lib/email'

export type ActionState = {
  error?: string
  message?: string
}

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciales inválidas. Verifica tu email y contraseña.' }
  }

  // El middleware determina la ruta correcta según rol
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ---------------------------------------------------------------------------
// REGISTRO TRANSACCIONAL
// Orden: auth.users → roles_usuario → perfiles_negocio
// La cuenta nace en estado 'suspendido' (sin prueba gratuita).
// ---------------------------------------------------------------------------

function generarSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export async function registroAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombreNegocio = formData.get('nombre_negocio') as string

  if (!email || !password || !nombreNegocio) {
    return { error: 'Todos los campos son requeridos.' }
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  // Usamos el service client para poder insertar en tablas protegidas por RLS
  // sin depender de una sesión activa aún inexistente.
  const serviceClient = createServiceClient()

  // 1. Crear usuario en auth.users
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Confirmar email automáticamente en MVP
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { error: 'Ya existe una cuenta con este email.' }
    }
    return { error: 'Error al crear la cuenta. Intenta de nuevo.' }
  }

  const userId = authData.user.id

  // 2. Insertar rol admin_negocio
  const { error: rolError } = await serviceClient
    .from('roles_usuario')
    .insert({ id: userId, role: 'admin_negocio' })

  if (rolError) {
    // Rollback: eliminar el usuario recién creado para no dejar estado inconsistente
    await serviceClient.auth.admin.deleteUser(userId)
    return { error: 'Error interno al configurar el rol. Intenta de nuevo.' }
  }

  // 3. Crear perfil del negocio con estado 'suspendido'
  const slugBase = generarSlug(nombreNegocio)
  const slugUnico = `${slugBase}-${userId.slice(0, 8)}`

  const { error: perfilError } = await serviceClient
    .from('perfiles_negocio')
    .insert({
      user_id: userId,
      nombre_negocio: nombreNegocio,
      slug: slugUnico,
      estado_cuenta: 'suspendido', // Sin prueba gratuita: nace suspendido
    })

  if (perfilError) {
    // Rollback completo
    await serviceClient.auth.admin.deleteUser(userId)
    return { error: 'Error interno al crear el perfil del negocio. Intenta de nuevo.' }
  }

  redirect('/registro/pendiente')
}

// ---------------------------------------------------------------------------
// RECUPERAR CONTRASEÑA
// ---------------------------------------------------------------------------

export async function recuperarPasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email) return { error: 'El email es requerido.' }

  const service = createServiceClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://awel.catalina-araya-ct.workers.dev'

  // Generar enlace de recuperación via admin API (no envía email propio de Supabase)
  const { data, error } = await service.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${siteUrl}/nueva-password`,
    },
  })

  // Respuesta genérica para no revelar si el email existe
  if (error || !data?.properties?.action_link) {
    return { message: 'Si existe una cuenta con ese email, recibirás las instrucciones en breve.' }
  }

  try {
    await enviarEmailRecuperacion({
      to:     email,
      enlace: data.properties.action_link,
    })
  } catch (err) {
    console.error('[recuperarPassword] Error enviando email:', err)
  }

  return { message: 'Si existe una cuenta con ese email, recibirás las instrucciones en breve.' }
}

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
