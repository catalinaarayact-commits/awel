import type { Metadata } from 'next'
import { Montserrat, Playfair_Display, Cormorant } from 'next/font/google'
import './globals.css'

// Fuente decorativa de la landing — Cormorant (Google Fonts)
// Alto contraste, trazos caligráficos — sólo para headlines de marketing
const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

// Fuente serif del dashboard — Playfair Display (Google Fonts)
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

// Fuente de UI e interfaz — Montserrat (Google Fonts)
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'awel — Gestión para centros de wellness y belleza',
  description:
    'Plataforma SaaS para spas, salones y centros de bienestar en Chile. Agenda, clientes, fidelización y más.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${playfair.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
