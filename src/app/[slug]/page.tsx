import { notFound } from 'next/navigation'
import { getNegocioPorSlug, getServiciosActivos, getHorariosAtencion } from '@/actions/public'
import type { HorarioAtencion } from '@/types/database'
import { BookingFlow } from '@/components/public/booking-flow'
import type { Metadata } from 'next'
import type React from 'react'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const negocio = await getNegocioPorSlug(slug)
  if (!negocio) return { title: 'Página no encontrada' }
  return {
    title: `Reservar en ${negocio.nombre_negocio}`,
    description: negocio.texto_bienvenida ?? undefined,
  }
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params
  const negocio = await getNegocioPorSlug(slug)
  if (!negocio) notFound()

  const [servicios, horarios] = await Promise.all([
    getServiciosActivos(negocio.id),
    getHorariosAtencion(negocio.id),
  ])

  return (
    <main
      className="min-h-screen bg-[var(--booking-bg,theme(colors.brand-oat))]"
      style={{ '--primary': negocio.color_primario } as React.CSSProperties}
    >
      <BookingFlow negocio={negocio} servicios={servicios} horarios={horarios} />
    </main>
  )
}
