import { type NextRequest, NextResponse } from 'next/server'

/**
 * Proxy (middleware) — mínimo para Cloudflare Workers.
 *
 * Cloudflare Workers no soporta Node.js middleware con lógica compleja.
 * Los guards de autenticación viven en los layouts de servidor:
 *   - /dashboard  → src/app/dashboard/layout.tsx
 *   - /superadmin → src/app/superadmin/layout.tsx
 */
export async function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
