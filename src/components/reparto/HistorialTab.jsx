import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchEjecucion, fetchEjecuciones, fetchListas } from '@/api/repartos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { RecordCard } from '@/components/ui/record-card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/format'

function DetalleEjecucionDialog({ ejecucionId, trigger }) {
  const [open, setOpen] = useState(false)

  const { data: ejecucion, isLoading } = useQuery({
    queryKey: ['repartos', 'ejecuciones', ejecucionId],
    queryFn: () => fetchEjecucion(ejecucionId),
    enabled: open,
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{ejecucion?.lista_nombre ?? 'Detalle del reparto'}</DialogTitle>
        </DialogHeader>

        {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>}

        {ejecucion && (
          <div className="flex flex-col gap-3">
            {ejecucion.items
              .slice()
              .sort((a, b) => a.orden - b.orden)
              .map((item) => (
                <div key={item.id} className="flex flex-col gap-1 rounded-md bg-muted p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {item.cliente_nombre}
                      {item.direccion && (
                        <span className="font-normal text-muted-foreground"> — {item.direccion}</span>
                      )}
                    </span>
                    <Badge variant={item.visitado ? 'success' : 'destructive'}>
                      {item.visitado ? 'Visitado' : 'No visitado'}
                    </Badge>
                  </div>
                  {item.productos.length > 0 ? (
                    item.productos.map((producto) => (
                      <div key={producto.producto_id} className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{producto.producto_nombre}</span>
                        <span className="font-mono-num">{producto.cantidad}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {item.visitado ? 'Visitado sin despacho registrado.' : 'Sin despachos ese día.'}
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function HistorialTab() {
  const [listaRepartoId, setListaRepartoId] = useState('todas')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const { data: listas } = useQuery({
    queryKey: ['repartos', 'listas', { paraFiltro: true }],
    queryFn: () => fetchListas({}),
  })

  const { data: ejecuciones, isLoading, isError } = useQuery({
    queryKey: ['repartos', 'ejecuciones', { listaRepartoId, desde, hasta }],
    queryFn: () =>
      fetchEjecuciones({
        listaRepartoId: listaRepartoId !== 'todas' ? listaRepartoId : undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      }),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={listaRepartoId} onValueChange={setListaRepartoId}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Lista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las listas</SelectItem>
            {listas?.map((lista) => (
              <SelectItem key={lista.id} value={lista.id}>{lista.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-full sm:w-40" />
        <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-full sm:w-40" />
      </div>

      {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>}
      {isError && (
        <p className="py-8 text-center text-sm text-destructive">No se pudo cargar el historial.</p>
      )}
      {ejecuciones?.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay repartos registrados con esos filtros.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ejecuciones?.map((ejecucion) => (
          <RecordCard
            key={ejecucion.id}
            title={ejecucion.lista_nombre}
            badge={
              <Badge variant={ejecucion.estado === 'completado' ? 'success' : 'outline'}>
                {ejecucion.estado === 'completado' ? 'Completado' : 'Pendiente'}
              </Badge>
            }
            fields={[
              { label: 'Fecha', value: formatDate(ejecucion.fecha) },
              { label: 'Tipo', value: ejecucion.lista_tipo === 'semanal' ? 'Semanal' : 'Única' },
            ]}
            actions={
              <DetalleEjecucionDialog
                ejecucionId={ejecucion.id}
                trigger={<Button variant="outline" size="sm">Ver detalle</Button>}
              />
            }
          />
        ))}
      </div>
    </div>
  )
}