import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: No escribir lógica entre createServerClient y auth.getUser().
  // Un bug sutil puede invalidar la sesión del usuario.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // --- Rutas /superadmin/* ---
  if (pathname.startsWith('/superadmin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const { data: rolData } = await supabase
      .from('roles_usuario')
      .select('role')
      .eq('id', user.id)
      .single()

    if (rolData?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // --- Rutas /dashboard/* ---
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: rolData } = await supabase
      .from('roles_usuario')
      .select('role')
      .eq('id', user.id)
      .single()

    if (rolData?.role !== 'admin_negocio') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verificar estado de cuenta — excepto en la propia ruta /inactivo
    if (!pathname.startsWith('/dashboard/inactivo')) {
      const { data: perfil } = await supabase
        .from('perfiles_negocio')
        .select('estado_cuenta')
        .eq('user_id', user.id)
        .single()

      if (perfil?.estado_cuenta === 'suspendido') {
        return NextResponse.redirect(new URL('/dashboard/inactivo', request.url))
      }
    }
  }

  // Redirigir usuarios autenticados fuera de las rutas de auth
  if (user && (pathname === '/login' || pathname === '/registro')) {
    const { data: rolData } = await supabase
      .from('roles_usuario')
      .select('role')
      .eq('id', user.id)
      .single()

    const destino = rolData?.role === 'superadmin' ? '/superadmin' : '/dashboard'
    return NextResponse.redirect(new URL(destino, request.url))
  }

  return supabaseResponse
}
