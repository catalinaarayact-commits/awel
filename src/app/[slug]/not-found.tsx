import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-oat px-4 text-center">
      <p className="font-serif text-6xl text-brand-purple">404</p>
      <h1 className="font-serif text-2xl text-brand-ink">Negocio no encontrado</h1>
      <p className="font-sans text-sm text-brand-ink-light max-w-xs">
        Esta página de reservas no existe o está temporalmente desactivada.
      </p>
      <Link href="/" className="font-sans text-sm text-brand-purple underline underline-offset-4">
        Volver al inicio
      </Link>
    </main>
  )
}
