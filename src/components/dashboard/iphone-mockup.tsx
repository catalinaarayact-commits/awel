import Image from 'next/image'

interface PreviewData {
  logoUrl: string | null       // URL del logo (remoto o blob local)
  colorPrimario: string        // hex ej. "#D98CF4"
  textoBienvenida: string | null
  nombreNegocio: string
}

interface IphoneMockupProps {
  preview: PreviewData
}

// Servicios de ejemplo para el preview
const SERVICIOS_EJEMPLO = [
  { nombre: 'Masaje relajante',   duracion: '60 min', precio: '$45.000' },
  { nombre: 'Facial hidratante',  duracion: '45 min', precio: '$38.000' },
  { nombre: 'Manicure express',   duracion: '30 min', precio: '$22.000' },
]

export function IphoneMockup({ preview }: IphoneMockupProps) {
  const { logoUrl, colorPrimario, textoBienvenida, nombreNegocio } = preview

  // Hex → rgb para el glow del header
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
  }

  const rgb = hexToRgb(colorPrimario)

  return (
    // Outer glow container
    <div
      className="relative mx-auto"
      style={{
        filter: `drop-shadow(0 32px 64px rgba(${rgb}, 0.25)) drop-shadow(0 8px 24px rgba(0,0,0,0.15))`,
        width: 'fit-content',
      }}
    >
      {/* ── iPhone frame ───────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden bg-slate-900"
        style={{
          width: '280px',
          height: '568px',
          borderRadius: '44px',
          padding: '2px',
        }}
      >
        {/* Frame inner border (screen bezel) */}
        <div
          className="absolute inset-0 rounded-[42px] pointer-events-none z-20"
          style={{
            boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.12), inset 0 0 0 3px rgba(0,0,0,0.6)',
          }}
        />

        {/* Botones laterales izquierda — volumen */}
        <div className="absolute -left-[3px] top-[96px] w-[3px] h-[32px] bg-slate-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-[140px] w-[3px] h-[32px] bg-slate-700 rounded-l-sm" />
        {/* Botón lateral derecha — encendido */}
        <div className="absolute -right-[3px] top-[116px] w-[3px] h-[56px] bg-slate-700 rounded-r-sm" />

        {/* Screen area */}
        <div className="absolute inset-[2px] overflow-hidden rounded-[42px] bg-white">

          {/* Dynamic Island */}
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black rounded-full"
            style={{ width: '92px', height: '28px' }}
          />

          {/* ── App content (scrollable) ─────────────────────────────── */}
          <div className="absolute inset-0 overflow-y-auto scrollbar-none pt-12"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

            {/* Hero header con color del negocio */}
            <div
              className="relative flex flex-col items-center px-5 pb-6 pt-4"
              style={{
                background: `linear-gradient(160deg, ${colorPrimario}28 0%, ${colorPrimario}10 100%)`,
              }}
            >
              {/* Logo o inicial */}
              <div className="mb-3 mt-2">
                {logoUrl ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt={nombreNegocio}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm text-white font-serif text-2xl font-semibold"
                    style={{ backgroundColor: colorPrimario }}
                  >
                    {nombreNegocio.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <h2
                className="font-serif text-center leading-tight text-[17px] text-brand-ink"
                style={{ letterSpacing: '-0.02em' }}
              >
                {nombreNegocio}
              </h2>

              {textoBienvenida && (
                <p className="mt-1.5 text-center font-sans text-[11px] font-light leading-snug text-brand-ink-light">
                  {textoBienvenida}
                </p>
              )}

              {/* Rating fake */}
              <div className="mt-2 flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="h-3 w-3" viewBox="0 0 12 12" fill={colorPrimario}>
                    <path d="M6 1l1.3 2.7 3 .4-2.2 2.1.5 3L6 7.8 3.4 9.2l.5-3L1.7 4.1l3-.4z"/>
                  </svg>
                ))}
                <span className="ml-1 text-[10px] text-brand-ink-light font-sans">4.9</span>
              </div>
            </div>

            {/* CTA de reserva */}
            <div className="px-4 py-3">
              <button
                className="w-full rounded-2xl py-3 text-[12px] font-sans font-medium uppercase tracking-widest text-white shadow-sm transition-transform active:scale-95"
                style={{ backgroundColor: colorPrimario }}
              >
                Reservar ahora
              </button>
            </div>

            {/* Sección de servicios */}
            <div className="px-4 pb-4">
              <p className="mb-2 font-sans text-[9px] font-medium uppercase tracking-widest text-brand-ink-light">
                Nuestros servicios
              </p>
              <div className="space-y-2">
                {SERVICIOS_EJEMPLO.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 shadow-[0_1px_8px_rgba(0,0,0,0.06)] border border-slate-50"
                  >
                    <div>
                      <p className="font-sans text-[12px] font-medium text-brand-ink">{s.nombre}</p>
                      <p className="font-sans text-[10px] text-brand-ink-light">{s.duracion}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-[11px] font-semibold text-brand-ink">{s.precio}</span>
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: colorPrimario }}
                      >
                        <svg viewBox="0 0 10 10" fill="none" className="h-3 w-3">
                          <path d="M5 2v6M2 5h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spacer para que haya algo de scroll */}
            <div className="h-6" />
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-28 rounded-full bg-slate-300" />
        </div>
      </div>
    </div>
  )
}
