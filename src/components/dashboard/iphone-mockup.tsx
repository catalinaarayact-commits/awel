import Image from 'next/image'

interface PreviewData {
  logoUrl: string | null
  portadaUrl: string | null
  colorPrimario: string
  textoBienvenida: string | null
  nombreNegocio: string
}

interface IphoneMockupProps {
  preview: PreviewData
}

const SERVICIOS_EJEMPLO = [
  { nombre: 'Masaje relajante',  duracion: '60 min', precio: '$45.000' },
  { nombre: 'Facial hidratante', duracion: '45 min', precio: '$38.000' },
  { nombre: 'Manicure express',  duracion: '30 min', precio: '$22.000' },
]

export function IphoneMockup({ preview }: IphoneMockupProps) {
  const { logoUrl, portadaUrl, colorPrimario, textoBienvenida, nombreNegocio } = preview

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
  }

  const rgb = hexToRgb(colorPrimario)

  return (
    <div
      className="relative mx-auto"
      style={{
        filter: `drop-shadow(0 32px 64px rgba(${rgb}, 0.25)) drop-shadow(0 8px 24px rgba(0,0,0,0.15))`,
        width: 'fit-content',
      }}
    >
      <div
        className="relative overflow-hidden bg-slate-900"
        style={{ width: '280px', height: '568px', borderRadius: '44px', padding: '2px' }}
      >
        {/* Frame bezel */}
        <div
          className="absolute inset-0 rounded-[42px] pointer-events-none z-20"
          style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.12), inset 0 0 0 3px rgba(0,0,0,0.6)' }}
        />

        {/* Side buttons */}
        <div className="absolute -left-[3px] top-[96px] w-[3px] h-[32px] bg-slate-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-[140px] w-[3px] h-[32px] bg-slate-700 rounded-l-sm" />
        <div className="absolute -right-[3px] top-[116px] w-[3px] h-[56px] bg-slate-700 rounded-r-sm" />

        {/* Screen */}
        <div className="absolute inset-[2px] overflow-hidden rounded-[42px] bg-white">

          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black rounded-full" style={{ width: '92px', height: '28px' }} />

          {/* Scrollable content */}
          <div className="absolute inset-0 overflow-y-auto pt-10" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

            {/* Hero: portada o gradiente */}
            <div className="relative">
              {portadaUrl ? (
                <div className="relative h-36 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={portadaUrl} alt="Portada" className="h-full w-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35) 100%)' }} />
                </div>
              ) : (
                <div
                  className="h-20 w-full"
                  style={{ background: `linear-gradient(135deg, ${colorPrimario}40 0%, ${colorPrimario}18 100%)` }}
                />
              )}

              {/* Logo flotante */}
              <div className={`flex flex-col items-center px-5 pb-4 ${portadaUrl ? '-mt-8' : 'pt-2'}`}>
                {logoUrl ? (
                  <div className="mb-2 h-14 w-14 overflow-hidden rounded-2xl border-2 border-white shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt={nombreNegocio} className="h-full w-full object-contain bg-white" />
                  </div>
                ) : (
                  <div
                    className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white shadow-md font-serif text-2xl font-semibold text-white"
                    style={{ backgroundColor: colorPrimario }}
                  >
                    {nombreNegocio.charAt(0).toUpperCase()}
                  </div>
                )}

                <h2 className="font-serif text-center text-[17px] leading-tight text-brand-ink" style={{ letterSpacing: '-0.02em' }}>
                  {nombreNegocio}
                </h2>

                {textoBienvenida && (
                  <p className="mt-1 text-center font-sans text-[10px] font-light leading-snug text-brand-ink-light">
                    {textoBienvenida}
                  </p>
                )}

                {/* Rating */}
                <div className="mt-1.5 flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="h-3 w-3" viewBox="0 0 12 12" fill={colorPrimario}>
                      <path d="M6 1l1.3 2.7 3 .4-2.2 2.1.5 3L6 7.8 3.4 9.2l.5-3L1.7 4.1l3-.4z"/>
                    </svg>
                  ))}
                  <span className="ml-1 font-sans text-[10px] text-brand-ink-light">4.9</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="px-4 pb-3">
              <button
                className="w-full rounded-2xl py-2.5 text-[12px] font-sans font-medium uppercase tracking-widest text-white shadow-sm"
                style={{ backgroundColor: colorPrimario }}
              >
                Reservar ahora
              </button>
            </div>

            {/* Servicios */}
            <div className="px-4 pb-6">
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
                      <div className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: colorPrimario }}>
                        <svg viewBox="0 0 10 10" fill="none" className="h-3 w-3">
                          <path d="M5 2v6M2 5h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-28 rounded-full bg-slate-300" />
        </div>
      </div>
    </div>
  )
}
