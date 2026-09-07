import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/api/client'
import { actualizarItemEjecucion, fetchRepartoHoy } from '@/api/repartos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { NuevoDespachoDialog } from '@/components/despachos/NuevoDespachoDialog'

function ClienteFila({ ejecucionId, item }) {
  const [despachoDialogOpen, setDespachoDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const marcarVisitadoMutation = useMutation({
    mutationFn: () => actualizarItemEjecucion({ ejecucionId, itemId: item.id, visitado: true }),
    onSuccess: () => {
      toast.success(`${item.cliente_nombre} marcado como visitado`)
      queryClient.invalidateQueries({ queryKey: ['repartos', 'hoy'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo marcar como visitado'))
    },
  })

  return (
    <div className={`flex flex-col gap-2 rounded-md border p-3 ${item.visitado ? 'border-success bg-success-soft' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium">
          {item.cliente_nombre}
          {item.direccion && (
            <span className="font-normal text-muted-foreground"> — {item.direccion}</span>
          )}
        </span>
        <Badge variant={item.visitado ? 'success' : 'outline'} className="shrink-0">
          {item.visitado ? 'Visitado' : 'Pendiente'}
        </Badge>
      </div>

      {item.productos.length > 0 && (
        <div className="flex flex-col gap-0.5 pl-1 text-xs text-muted-foreground">
          {item.productos.map((p) => (
            <span key={p.producto_id}>{p.producto_nombre} × {p.cantidad}</span>
          ))}
        </div>
      )}

      {!item.visitado && (
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={() => setDespachoDialogOpen(true)}>
            Nuevo despacho
          </Button>
          <Button
            type="button" variant="outline" size="sm"
            onClick={() => marcarVisitadoMutation.mutate()}
            disabled={marcarVisitadoMutation.isPending}
          >
            {marcarVisitadoMutation.isPending ? 'Guardando…' : 'Visitado sin despacho'}
          </Button>
        </div>
      )}

      <NuevoDespachoDialog
        open={despachoDialogOpen}
        onOpenChange={setDespachoDialogOpen}
        clienteIdInicial={item.cliente_id}
        clienteNombreInicial={item.cliente_nombre}
      />
    </div>
  )
}

/**
 * Dialog "Reparto de hoy" accesible desde Despachos — es la pantalla donde
 * el repartidor realmente trabaja: ve la lista de clientes a visitar, y
 * para cada uno crea el despacho real o lo marca visitado sin venta.
 * El seguimiento (visitado + productos reales) se recalcula solo, sin
 * cargar nada manualmente aparte de estas dos acciones.
 */
export function RepartoDelDiaDialog({ trigger }) {
  const [open, setOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['repartos', 'hoy'],
    queryFn: () => fetchRepartoHoy(),
    enabled: open,
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reparto de hoy</DialogTitle>
          <DialogDescription>
            Registrá el despacho de cada cliente a medida que los vayas visitando.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>}
        {isError && (
          <p className="py-8 text-center text-sm text-destructive">No se pudo cargar el reparto de hoy.</p>
        )}
        {data && data.ejecuciones.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay ninguna lista de reparto programada para hoy.
          </p>
        )}

        {data?.ejecuciones.map((ejecucion) => (
          <div key={ejecucion.id} className="flex flex-col gap-2">
            <p className="text-sm font-semibold">{ejecucion.lista_nombre}</p>
            {ejecucion.items
              .slice()
              .sort((a, b) => a.orden - b.orden)
              .map((item) => (
                <ClienteFila key={item.id} ejecucionId={ejecucion.id} item={item} />
              ))}
          </div>
        ))}
      </DialogContent>
    </Dialog>
  )
}