'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GestionarNegocioModal, EstadoBadge } from './gestionar-negocio-modal'
import type { NegocioConEmail } from '@/types/database'
import { Search, Settings2 } from 'lucide-react'

interface Props {
  negocios: NegocioConEmail[]
}

export function NegociosTabla({ negocios }: Props) {
  const [query, setQuery]               = useState('')
  const [selected, setSelected]         = useState<NegocioConEmail | null>(null)
  const [modalOpen, setModalOpen]       = useState(false)

  const filtered = negocios.filter(n => {
    const q = query.toLowerCase()
    return (
      n.nombre_negocio.toLowerCase().includes(q) ||
      n.email.toLowerCase().includes(q) ||
      n.slug.toLowerCase().includes(q)
    )
  })

  function handleGestionar(negocio: NegocioConEmail) {
    setSelected(negocio)
    setModalOpen(true)
  }

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          placeholder="Buscar por nombre, email o slug…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-semibold text-slate-600">Negocio</TableHead>
              <TableHead className="font-semibold text-slate-600">Email</TableHead>
              <TableHead className="font-semibold text-slate-600">Slug</TableHead>
              <TableHead className="font-semibold text-slate-600">Estado</TableHead>
              <TableHead className="font-semibold text-slate-600">Vencimiento</TableHead>
              <TableHead className="font-semibold text-slate-600">Registrado</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  {query ? 'Sin resultados para tu búsqueda.' : 'No hay negocios registrados aún.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(negocio => (
                <TableRow
                  key={negocio.id}
                  className="group transition-colors hover:bg-slate-50/70"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: negocio.color_primario ?? '#6366f1' }}
                      >
                        {negocio.nombre_negocio.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800 text-sm">
                        {negocio.nombre_negocio}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{negocio.email}</TableCell>
                  <TableCell>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 font-mono">
                      {negocio.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={negocio.estado_cuenta} />
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {negocio.fecha_vencimiento_suscripcion
                      ? formatFecha(negocio.fecha_vencimiento_suscripcion)
                      : <span className="text-slate-300">—</span>
                    }
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {formatFecha(negocio.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGestionar(negocio)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 gap-1.5 text-xs"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      Gestionar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="mt-2 text-right text-xs text-slate-400">
        {filtered.length} de {negocios.length} negocios
      </p>

      {/* Modal */}
      {selected && (
        <GestionarNegocioModal
          negocio={selected}
          open={modalOpen}
          onOpenChange={open => {
            setModalOpen(open)
            if (!open) setSelected(null)
          }}
        />
      )}
    </>
  )
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
