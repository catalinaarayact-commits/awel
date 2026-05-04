'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { recuperarPasswordAction } from '@/actions/auth'
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

export default function RecuperarPasswordPage() {
  const [state, action, isPending] = useActionState(recuperarPasswordAction, {})

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Recuperar contraseña</CardTitle>
        <CardDescription>
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </CardDescription>
      </CardHeader>

      <form action={action}>
        <CardContent className="space-y-4">
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {state.error}
            </div>
          )}

          {state.message ? (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              <p className="font-medium">Email enviado</p>
              <p className="mt-1">{state.message}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@negocio.cl"
                autoComplete="email"
                required
                disabled={isPending}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {!state.message && (
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Enviando...' : 'Enviar instrucciones'}
            </Button>
          )}

          <Link
            href="/login"
            className="text-sm text-slate-500 hover:text-slate-900 text-center transition-colors"
          >
            ← Volver al inicio de sesión
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
