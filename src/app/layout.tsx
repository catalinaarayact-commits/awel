import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Montserrat, Playfair_Display } from 'next/font/google'
import './globals.css'

// Fuente decorativa de la landing — Ombre Nouveau (local)
// Curvas fluidas, alto contraste — sólo para headlines de marketing
const ombreNouveau = localFont({
  src: [
    {
      path: '../../public/fonts/OmbreNouveauDEMO-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/OmbreNouveauDEMO-LightItalic.ttf',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../../public/fonts/OmbreNouveauDEMO-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/OmbreNouveauDEMO-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/OmbreNouveauDEMO-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/OmbreNouveauDEMO-MediumItalic.ttf',
      weight: '500',
      style: 'italic',
    },
  ],
  variable: '--font-display',
  display: 'swap',
})

// Fuente serif del dashboard — Playfair Display (Google Fonts)
// Elegante, legible, perfecta para títulos de UI interior
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
      className={`${ombreNouveau.variable} ${playfair.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
