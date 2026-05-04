'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ActionResult, PersonalizacionNegocio } from '@/types/database'

// ─── Guard: obtener el negocio del usuario autenticado ───────────────────────

async function getNegocioDelUsuario() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('No autenticado')

  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles_negocio')
    .select('id, nombre_negocio, logo_url, color_primario, texto_bienvenida, slug, estado_cuenta')
    .eq('user_id', user.id)
    .single()

  if (perfilError || !perfil) throw new Error('Negocio no encontrado')
  return { user, perfil }
}

// ─── Obtener perfil para el editor ──────────────────────────────────────────

export async function getPersonalizacion(): Promise<PersonalizacionNegocio> {
  const { perfil } = await getNegocioDelUsuario()
  return {
    id:               perfil.id,
    nombre_negocio:   perfil.nombre_negocio,
    logo_url:         perfil.logo_url,
    color_primario:   perfil.color_primario ?? '#D98CF4',
    texto_bienvenida: perfil.texto_bienvenida,
    slug:             perfil.slug,
  }
}

// ─── Guardar personalización (color + texto_bienvenida) ──────────────────────
// El logo se maneja por separado con uploadLogoAction.

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
    .update({
      color_primario:   colorPrimario,
      texto_bienvenida: textoBienvenida || null,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', negocioId)

  if (error) {
    return { ok: false, error: `Error al guardar: ${error.message}` }
  }

  revalidatePath('/dashboard/personalizacion')
  return { ok: true }
}

// ─── Subir logo a Supabase Storage ──────────────────────────────────────────
// Bucket requerido: 'logos' (público). Crear en Supabase > Storage > New Bucket.

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
  if (!file || file.size === 0) {
    return { ok: false, error: 'No se recibió ningún archivo.' }
  }

  const maxSizeMB = 2
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { ok: false, error: `El archivo no puede superar ${maxSizeMB} MB.` }
  }

  const ext     = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const allowed = ['png', 'jpg', 'jpeg', 'webp', 'svg']
  if (!allowed.includes(ext)) {
    return { ok: false, error: 'Formato no permitido. Usa PNG, JPG, WEBP o SVG.' }
  }

  // Usar service client para tener permisos en Storage
  const service = createServiceClient()

  const storagePath = `${negocioId}/logo.${ext}`

  const { error: uploadError } = await service.storage
    .from('logos')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: true,  // sobrescribe si ya existe
    })

  if (uploadError) {
    return { ok: false, error: `Error al subir el archivo: ${uploadError.message}` }
  }

  // Obtener URL pública
  const { data: { publicUrl } } = service.storage
    .from('logos')
    .getPublicUrl(storagePath)

  // Actualizar perfil con la nueva URL
  const { error: updateError } = await service
    .from('perfiles_negocio')
    .update({
      logo_url:   publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', negocioId)

  if (updateError) {
    return { ok: false, error: `Logo subido pero falló la actualización del perfil: ${updateError.message}` }
  }

  revalidatePath('/dashboard/personalizacion')
  return { ok: true, data: publicUrl }
}
