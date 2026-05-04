'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { guardarPersonalizacionAction, uploadLogoAction } from '@/actions/dashboard'
import { IphoneMockup } from './iphone-mockup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PersonalizacionNegocio } from '@/types/database'
import { Upload, Check, Loader2, RefreshCw } from 'lucide-react'

// ─── Paleta predefinida ──────────────────────────────────────────────────────

const PALETTE = [
  { hex: '#D98CF4', label: 'Pastel Purple' },
  { hex: '#8CA7F4', label: 'Soft Blue'     },
  { hex: '#DBF48C', label: 'Yuzu Zest'     },
  { hex: '#F4A8C6', label: 'Blush Rose'    },
  { hex: '#A8D4F5', label: 'Sky Mist'      },
  { hex: '#F5C4A0', label: 'Peach Soft'    },
  { hex: '#A0E4C8', label: 'Sage Mist'     },
  { hex: '#C4B5F5', label: 'Lavender'      },
]

// ─── Color Picker inline ─────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (hex: string) => void
}) {
  return (
    <div className="space-y-3">
      {/* Swatches */}
      <div className="grid grid-cols-8 gap-2">
        {PALETTE.map(({ hex, label }) => (
          <button
            key={hex}
            type="button"
            title={label}
            onClick={() => onChange(hex)}
            className="group relative h-8 w-8 rounded-xl border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: hex,
              borderColor: value.toLowerCase() === hex.toLowerCase()
                ? hex
                : 'transparent',
            }}
          >
            {value.toLowerCase() === hex.toLowerCase() && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-white drop-shadow-sm" strokeWidth={3} />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Hex personalizado */}
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 shrink-0 rounded-xl border border-slate-200 shadow-sm"
          style={{ backgroundColor: value }}
        />
        <div className="relative flex-1">
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <Input
            value={value.toUpperCase()}
            onChange={e => {
              const v = e.target.value
              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v)
            }}
            className="font-mono text-sm"
            placeholder="#D98CF4"
            maxLength={7}
          />
        </div>
        <span className="text-xs text-slate-400 shrink-0">personalizado</span>
      </div>
    </div>
  )
}

// ─── Logo Uploader ────────────────────────────────────────────────────────────

function LogoUploader({
  currentUrl,
  previewUrl,
  onPreviewChange,
  onUploadSuccess,
}: {
  currentUrl: string | null
  previewUrl: string | null
  onPreviewChange: (url: string | null) => void
  onUploadSuccess: (url: string) => void
}) {
  const [uploadState, uploadAction] = useActionState(uploadLogoAction, { ok: false })
  const [isUploading, startUpload] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const displayUrl = previewUrl ?? currentUrl

  function handleFile(file: File) {
    // Preview inmediato con blob URL
    const blobUrl = URL.createObjectURL(file)
    onPreviewChange(blobUrl)

    // Upload
    const fd = new FormData()
    fd.append('logo', file)
    startUpload(async () => {
      const result = await uploadLogoAction({ ok: false }, fd)
      if (result.ok && result.data) {
        onUploadSuccess(result.data)
        URL.revokeObjectURL(blobUrl)
      }
    })
  }

  return (
    <div className="space-y-3">
      <div
        className="relative flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-brand-purple hover:bg-brand-purple-soft/20"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-brand-purple') }}
        onDragLeave={e => e.currentTarget.classList.remove('border-brand-purple')}
        onDrop={e => {
          e.preventDefault()
          e.currentTarget.classList.remove('border-brand-purple')
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
        ) : displayUrl ? (
          <div className="flex flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayUrl} alt="Logo" className="h-14 w-auto max-w-[120px] object-contain" />
            <span className="text-xs text-brand-ink-light">Click para cambiar</span>
          </div>
        ) : (
          <>
            <Upload className="h-5 w-5 text-slate-400" />
            <p className="text-center text-xs text-slate-500">
              Arrastra tu logo aquí<br />
              <span className="text-slate-400">PNG, JPG, WEBP o SVG · Máx. 2 MB</span>
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>

      {uploadState.ok && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600">
          <Check className="h-3.5 w-3.5" /> Logo guardado
        </p>
      )}
      {uploadState.error && (
        <p className="text-xs text-red-500">{uploadState.error}</p>
      )}
    </div>
  )
}

// ─── Editor principal ─────────────────────────────────────────────────────────

interface EditorProps {
  perfil: PersonalizacionNegocio
}

export function EditorPersonalizacion({ perfil }: EditorProps) {
  // Estado del preview (refleja la BD + cambios locales aún no guardados)
  const [color, setColor]               = useState(perfil.color_primario)
  const [texto, setTexto]               = useState(perfil.texto_bienvenida ?? '')
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null)
  const [savedLogoUrl, setSavedLogoUrl]     = useState(perfil.logo_url)

  const [saveState, saveAction, isSaving] = useActionState(guardarPersonalizacionAction, { ok: false })

  const previewData = {
    logoUrl:         previewLogoUrl ?? savedLogoUrl,
    colorPrimario:   color,
    textoBienvenida: texto || null,
    nombreNegocio:   perfil.nombre_negocio,
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:gap-12">

      {/* ════ COLUMNA IZQUIERDA — Formulario ════════════════════════════════ */}
      <div className="space-y-6">

        {/* Logo */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-serif text-lg text-brand-ink">Logo del negocio</h3>
            <p className="mt-0.5 font-sans text-xs text-brand-ink-light">
              Se mostrará en tu página pública de reservas
            </p>
          </div>
          <LogoUploader
            currentUrl={savedLogoUrl}
            previewUrl={previewLogoUrl}
            onPreviewChange={setPreviewLogoUrl}
            onUploadSuccess={url => { setSavedLogoUrl(url); setPreviewLogoUrl(null) }}
          />
        </section>

        {/* Formulario de personalización */}
        <form action={saveAction}>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-5">

            {/* Color primario */}
            <div className="space-y-2">
              <Label className="font-sans text-sm font-medium text-brand-ink">
                Color primario
              </Label>
              <p className="text-xs text-brand-ink-light">
                Defines la identidad visual de tu página. Se aplica a botones, iconos y fondos.
              </p>
              <ColorPicker value={color} onChange={setColor} />
              {/* Hidden input para el Server Action */}
              <input type="hidden" name="color_primario" value={color} />
            </div>

            <hr className="border-slate-100" />

            {/* Texto de bienvenida */}
            <div className="space-y-2">
              <Label htmlFor="texto_bienvenida" className="font-sans text-sm font-medium text-brand-ink">
                Texto de bienvenida
              </Label>
              <Input
                id="texto_bienvenida"
                name="texto_bienvenida"
                placeholder="Ej: Relájate y renueva tu energía"
                value={texto}
                onChange={e => setTexto(e.target.value)}
                maxLength={80}
                className="text-sm"
              />
              <p className="text-right text-xs text-slate-400">{texto.length}/80</p>
            </div>

            {/* Feedback */}
            {saveState.error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                {saveState.error}
              </div>
            )}
            {saveState.ok && (
              <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                Cambios guardados correctamente
              </div>
            )}

            {/* Botón Guardar */}
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full font-sans font-medium uppercase tracking-widest text-xs"
            >
              {isSaving ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Guardando...</>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* ════ COLUMNA DERECHA — Preview en vivo ════════════════════════════ */}
      <div className="flex flex-col items-center gap-4 lg:sticky lg:top-8 lg:self-start">

        {/* Label del preview */}
        <div className="flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 text-brand-ink-light" />
          <span className="font-sans text-xs font-medium uppercase tracking-widest text-brand-ink-light">
            Vista previa en vivo
          </span>
        </div>

        <IphoneMockup preview={previewData} />

        <p className="max-w-[200px] text-center font-sans text-[11px] leading-relaxed text-brand-ink-light">
          Así verán tu negocio los clientes al visitar tu página de reservas.
        </p>
      </div>
    </div>
  )
}
