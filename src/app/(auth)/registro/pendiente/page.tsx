import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function RegistroPendientePage() {
  return (
    <Card className="shadow-lg border-0 text-center">
      <CardHeader>
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold">¡Cuenta creada!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-600">
          Tu registro fue exitoso. Nuestro equipo revisará tu cuenta y la activará
          dentro de las próximas <strong>24 horas hábiles</strong>.
        </p>
        <p className="text-slate-500 text-sm">
          Recibirás un email de confirmación cuando tu cuenta esté activa.
        </p>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: 'outline' }), 'w-full mt-2')}
        >
          Ir al inicio de sesión
        </Link>
      </CardContent>
    </Card>
  )
}
