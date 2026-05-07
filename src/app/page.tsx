import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import {
  CalendarCheck2,
  Clock4,
  Users,
  Mail,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react'

// ─── Datos estáticos ──────────────────────────────────────────────────────────

const features = [
  {
    icon: CalendarCheck2,
    title: 'Reservas online 24/7',
    desc: 'Tus clientes reservan desde su celular a cualquier hora. Sin llamadas, sin WhatsApp de madrugada, sin hojas de papel.',
  },
  {
    icon: Clock4,
    title: 'Agenda inteligente',
    desc: 'Define tus horarios de atención por día. El sistema bloquea los horarios ocupados y solo muestra los espacios reales disponibles.',
  },
  {
    icon: Users,
    title: 'Directorio de clientes',
    desc: 'Cada reserva crea un perfil automático. Accede al historial completo de citas de cualquier cliente con un clic.',
  },
  {
    icon: Mail,
    title: 'Emails automáticos',
    desc: 'Confirmaciones y cancelaciones llegan al cliente de forma inmediata. Diseñados con tu identidad visual.',
  },
  {
    icon: Sparkles,
    title: 'Tu página de marca',
    desc: 'Una URL propia con tu logo, color y fotos de servicios. Lista para compartir en Instagram, WhatsApp o Google.',
  },
  {
    icon: ArrowRight,
    title: 'Gestión de servicios',
    desc: 'Crea, edita y activa tus servicios con precios y duraciones. Solo los activos aparecen en tu página de reservas.',
  },
]

const pasos = [
  {
    n: '01',
    titulo: 'Crea tu perfil',
    desc: 'Registra tu centro, sube tu logo y define los servicios que ofreces. Listo en menos de 10 minutos.',
  },
  {
    n: '02',
    titulo: 'Personaliza tu página',
    desc: 'Elige tu color de marca, añade una foto de portada y una bienvenida. Tu página pública queda lista al instante.',
  },
  {
    n: '03',
    titulo: 'Comparte y recibe',
    desc: 'Comparte tu link único. Tus clientes reservan solos y tú ves todo desde el dashboard.',
  },
]

// ─── Componentes de layout ────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-purple">
      {children}
    </span>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-oat">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-brand-oat-dark bg-brand-oat/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo markSize={28} textVariant="purple" />

          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="font-sans text-xs font-medium uppercase tracking-widest text-brand-ink-light transition-colors hover:text-brand-ink px-4 py-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="rounded-2xl bg-brand-purple px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-brand-purple-mid"
            >
              Comenzar gratis
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28 lg:pt-36">

          {/* Fondo decorativo */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-brand-purple-soft/40 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-brand-yuzu/30 blur-3xl"
          />

          <div className="relative mx-auto max-w-4xl text-center">
            <Eyebrow>Software para centros de wellness · Chile</Eyebrow>

            <h1 className="mt-5 font-display text-5xl tracking-tighter leading-none text-brand-ink sm:text-6xl lg:text-8xl">
              tu agenda,<br />
              <em className="not-italic text-brand-purple">sin el caos.</em>
            </h1>

            <p className="mx-auto mt-8 max-w-xl font-sans font-light text-base leading-relaxed text-brand-ink-light sm:text-lg">
              awel es la plataforma todo-en-uno para spas, salones y centros de bienestar.
              Reservas online, agenda inteligente, directorio de clientes y emails automáticos
              — diseñados con la elegancia que tu negocio merece.
            </p>

            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/registro"
                className="w-full rounded-2xl bg-brand-ink px-8 py-4 font-sans text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-brand-ink/90 sm:w-auto"
              >
                Comenzar gratis
              </Link>
              <Link
                href="#como-funciona"
                className="w-full rounded-2xl border border-brand-oat-dark bg-white px-8 py-4 font-sans text-sm font-semibold uppercase tracking-widest text-brand-ink transition-colors hover:bg-brand-oat sm:w-auto"
              >
                Ver cómo funciona
              </Link>
            </div>

            <p className="mt-5 font-sans text-xs text-brand-ink-light">
              Sin tarjeta de crédito · 30 días gratis · Cancela cuando quieras
            </p>
          </div>
        </section>

        {/* ── Divider decorativo ─────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-brand-oat-dark to-transparent" />
        </div>

        {/* ── Features ───────────────────────────────────────────────────────── */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-6xl">

            <div className="mb-14 text-center">
              <Eyebrow>Funciones</Eyebrow>
              <h2 className="mt-4 font-display text-4xl tracking-tighter leading-tight text-brand-ink sm:text-5xl">
                todo lo que necesitas,<br />nada que no necesitas.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-brand-oat-dark bg-white p-7 transition-shadow hover:shadow-md"
                >
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple-soft">
                    <Icon className="h-5 w-5 text-brand-purple" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 font-display text-xl tracking-tight text-brand-ink">
                    {title}
                  </h3>
                  <p className="font-sans font-light text-sm leading-relaxed text-brand-ink-light">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cómo funciona ──────────────────────────────────────────────────── */}
        <section id="como-funciona" className="bg-brand-ink px-6 py-24">
          <div className="mx-auto max-w-6xl">

            <div className="mb-16 text-center">
              <Eyebrow>
                <span className="text-brand-purple-soft">Cómo funciona</span>
              </Eyebrow>
              <h2 className="mt-4 font-display text-4xl tracking-tighter leading-tight text-white sm:text-5xl">
                en marcha en minutos,<br />no en semanas.
              </h2>
            </div>

            <div className="grid gap-10 sm:grid-cols-3">
              {pasos.map(({ n, titulo, desc }) => (
                <div key={n} className="flex flex-col gap-4">
                  <span className="font-display text-7xl leading-none text-brand-purple/40">
                    {n}
                  </span>
                  <div>
                    <h3 className="mb-2 font-display text-2xl tracking-tight text-white">
                      {titulo}
                    </h3>
                    <p className="font-sans font-light text-sm leading-relaxed text-white/60">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ────────────────────────────────────────────────────────── */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl">

            <div className="mb-14 text-center">
              <Eyebrow>Planes</Eyebrow>
              <h2 className="mt-4 font-display text-4xl tracking-tighter leading-tight text-brand-ink sm:text-5xl">
                simple y transparente.
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              {/* Trial */}
              <div className="rounded-2xl border border-brand-oat-dark bg-white p-8">
                <Eyebrow>30 días gratis</Eyebrow>
                <p className="mt-3 font-display text-4xl tracking-tighter text-brand-ink">
                  $0
                </p>
                <p className="mt-1 font-sans text-xs text-brand-ink-light">
                  Sin tarjeta de crédito
                </p>
                <ul className="mt-8 space-y-3">
                  {[
                    'Página de reservas personalizada',
                    'Hasta 50 citas/mes',
                    'Directorio de clientes',
                    'Emails automáticos',
                    'Horarios configurables',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" strokeWidth={2.5} />
                      <span className="font-sans text-sm text-brand-ink-light">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registro"
                  className="mt-8 block w-full rounded-2xl border border-brand-oat-dark py-3 text-center font-sans text-xs font-semibold uppercase tracking-widest text-brand-ink transition-colors hover:bg-brand-oat"
                >
                  Empezar ahora
                </Link>
              </div>

              {/* Pro */}
              <div className="relative rounded-2xl bg-brand-purple p-8 text-white">
                <span className="absolute right-5 top-5 rounded-full bg-brand-yuzu px-3 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-widest text-brand-ink">
                  Próximamente
                </span>
                <Eyebrow>
                  <span className="text-white/60">Plan profesional</span>
                </Eyebrow>
                <p className="mt-3 font-display text-4xl tracking-tighter">
                  $XX.990
                </p>
                <p className="mt-1 font-sans text-xs text-white/60">
                  por mes · pago mensual
                </p>
                <ul className="mt-8 space-y-3">
                  {[
                    'Todo del plan gratuito',
                    'Citas ilimitadas',
                    'Múltiples profesionales',
                    'Estadísticas avanzadas',
                    'Soporte prioritario',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/80" strokeWidth={2.5} />
                      <span className="font-sans text-sm text-white/80">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 block w-full rounded-2xl bg-white/20 py-3 text-center font-sans text-xs font-semibold uppercase tracking-widest text-white/60 cursor-not-allowed select-none">
                  Muy pronto
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA final ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-brand-oat-dark px-6 py-28 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purple-soft/50 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl">
            <Eyebrow>Empieza hoy</Eyebrow>
            <h2 className="mt-4 font-display text-5xl tracking-tighter leading-none text-brand-ink sm:text-6xl lg:text-7xl">
              más tiempo para sanar,<br />
              <em className="not-italic text-brand-purple">menos tiempo en pantallas.</em>
            </h2>
            <p className="mx-auto mt-6 max-w-md font-sans font-light text-sm leading-relaxed text-brand-ink-light">
              Únete a los centros de bienestar que ya gestionan sus reservas con elegancia y simplicidad.
            </p>
            <Link
              href="/registro"
              className="mt-10 inline-block rounded-2xl bg-brand-ink px-10 py-4 font-sans text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-brand-ink/90"
            >
              Comenzar gratis — 30 días
            </Link>
            <p className="mt-4 font-sans text-xs text-brand-ink-light">
              Sin tarjeta · Cancela cuando quieras
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-brand-oat-dark bg-brand-oat px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Logo markSize={22} textVariant="purple" />
          <p className="font-sans text-xs text-brand-ink-light">
            © {new Date().getFullYear()} awel · Diseñado para el bienestar
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="font-sans text-xs text-brand-ink-light hover:text-brand-ink transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="font-sans text-xs text-brand-ink-light hover:text-brand-ink transition-colors">
              Registrarse
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
