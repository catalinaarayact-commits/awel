'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Logo } from '@/components/brand/logo'

export default function NuevaPasswordPage() {
  const router   = useRouter()
  const [password,    setPassword]    = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error,       setError]       = useState<string | null>(null)
  const [exito,       setExito]       = useState(false)
  const [pending,     startUpdate]    = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }

    startUpdate(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
      } else {
        setExito(true)
        setTimeout(() => router.push('/dashboard'), 2500)
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-oat px-4">
      <div className="mb-8">
        <Logo markSize={32} textVariant="purple" />
      </div>

      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Nueva contraseña</CardTitle>
          <CardDescription>
            Elige una contraseña segura para tu cuenta
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {exito ? (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                <p className="font-medium">Contraseña actualizada</p>
                <p className="mt-1">Redirigiendo al dashboard…</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    required
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmacion">Confirmar contraseña</Label>
                  <Input
                    id="confirmacion"
                    type="password"
                    value={confirmacion}
                    onChange={e => setConfirmacion(e.target.value)}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                    required
                    disabled={pending}
                  />
                </div>
              </>
            )}
          </CardContent>

          {!exito && (
            <CardFooter>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? 'Actualizando…' : 'Guardar contraseña'}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  )
}
