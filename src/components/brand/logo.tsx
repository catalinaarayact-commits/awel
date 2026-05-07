import Image from 'next/image'
import { cn } from '@/lib/utils'

// Dimensiones originales del PNG (940×639) → aspect ratio ≈ 1.472
const LOGO_ASPECT = 940 / 639

interface LogoProps {
  /** Muestra solo el símbolo sin el texto "awel" */
  markOnly?: boolean
  /** Altura del símbolo en px (el ancho se calcula automáticamente) */
  markSize?: number
  /** Color del texto: 'purple' | 'white' | 'dark' */
  textVariant?: 'purple' | 'white' | 'dark'
  className?: string
}

const textColors = {
  purple: 'text-[#D98CF4]',
  white:  'text-white',
  dark:   'text-slate-900',
}

export function Logo({
  markOnly = false,
  markSize = 36,
  textVariant = 'purple',
  className,
}: LogoProps) {
  const markWidth = Math.round(markSize * LOGO_ASPECT)

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Image
        src="/logo.png"
        alt="awel isotipo"
        width={markWidth}
        height={markSize}
        priority
        className="shrink-0"
      />

      {!markOnly && (
        <span
          className={cn(
            'font-serif tracking-tighter leading-none select-none',
            textColors[textVariant]
          )}
          style={{ fontSize: markSize * 0.88 }}
        >
          awel
        </span>
      )}
    </div>
  )
}
