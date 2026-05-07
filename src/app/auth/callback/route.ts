import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /auth/callback
 *
 * Supabase redirige aquí después de que el usuario hace clic en el enlace
 * de recuperación de contraseña. Intercambia el código por una sesión
 * y redirige al destino indicado por `next` (default: /nueva-password).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/nueva-password'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si falla el intercambio, redirigir al login con error
  return NextResponse.redirect(`${origin}/login?error=link_invalido`)
}
