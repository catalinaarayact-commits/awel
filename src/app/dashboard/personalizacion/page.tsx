import { getPersonalizacion } from '@/actions/dashboard'
import { EditorPersonalizacion } from '@/components/dashboard/editor-personalizacion'
import { Palette } from 'lucide-react'

export default async function PersonalizacionPage() {
  let perfil = null
  let errorMsg: string | null = null

  try {
    perfil = await getPersonalizacion()
  } catch (e) {
    errorMsg = (e as Error).message
  }

  return (
    <div className="px-6 py-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-5 w-5 text-brand-purple" />
          <h1 className="font-serif text-2xl text-brand-ink">Personalización</h1>
        </div>
        <p className="font-sans text-sm text-brand-ink-light">
          Diseña la apariencia de tu página pública de reservas.
          Los cambios se aplican en tiempo real en la vista previa.
        </p>
      </div>

      {errorMsg ? (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
          No se pudo cargar el perfil: {errorMsg}
        </div>
      ) : perfil ? (
        <EditorPersonalizacion perfil={perfil} />
      ) : null}
    </div>
  )
}
