'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registroAction } from '@/actions/auth'
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

export default function RegistroPage() {
  const [state, action, isPending] = useActionState(registroAction, {})

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
        <CardDescription>
          Registra tu centro de wellness o belleza en AWEL
        </CardDescription>
      </CardHeader>

      <form action={action}>
        <CardContent className="space-y-4">
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nombre_negocio">Nombre del negocio</Label>
            <Input
              id="nombre_negocio"
              name="nombre_negocio"
              type="text"
              placeholder="Spa Las Lilas"
              autoComplete="organization"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email de administrador</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@negocio.cl"
              autoComplete="email"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={isPending}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <p className="font-medium">¿Cómo funciona el acceso?</p>
            <p className="mt-1 text-amber-700">
              Tu cuenta será revisada y activada manualmente por nuestro equipo
              dentro de 24 horas hábiles. Te avisaremos por email.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>

          <p className="text-sm text-slate-500 text-center">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-slate-900 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
