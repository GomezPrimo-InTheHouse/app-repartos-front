import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { eliminarProducto } from '@/api/productos'
import { getApiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/format'

/**
 * "Ver producto" — dialog de solo lectura con todos los datos del registro,
 * más el botón "Eliminar" (baja lógica) adentro, vía ConfirmDialog controlado.
 *
 * El margen (precio_venta - costo_unitario) se calcula acá mismo: el backend
 * no lo devuelve en este endpoint.
 *
 * Nota: los campos de stock_actual/stock_minimo NO se muestran acá a
 * propósito — el sistema no controla stock en los despachos (ver addendum
 * "Eliminación del control de stock en Despachos"), así que mostrarlos
 * confundiría al usuario con un número que nunca cambia. Queda listo para
 * reactivar (ver bloque comentado abajo) el día que exista fabricación.
 */
export function ProductoDetalleDialog({ producto, trigger }) {
  const [open, setOpen] = useState(false)
  const [confirmEliminarOpen, setConfirmEliminarOpen] = useState(false)
  const queryClient = useQueryClient()

  const margen = producto.precio_venta - producto.costo_unitario

  const eliminarMutation = useMutation({
    mutationFn: () => eliminarProducto(producto.id),
    onSuccess: () => {
      toast.success(`${producto.nombre} fue dado de baja`)
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setConfirmEliminarOpen(false)
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo dar de baja al producto'))
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <DialogTitle>{producto.nombre}</DialogTitle>
          <Badge variant={producto.activo ? 'success' : 'destructive'}>
            {producto.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <DetalleCampo label="Categoría" value={producto.categoria} span2 />

          <DetalleCampo label="Costo unitario" value={formatCurrency(producto.costo_unitario)} mono />
          <DetalleCampo label="Precio de venta" value={formatCurrency(producto.precio_venta)} mono />

          <DetalleCampo
            label="Margen"
            value={
              <span className={margen >= 0 ? 'text-success' : 'text-destructive'}>
                {formatCurrency(margen)}
              </span>
            }
            mono
          />
          <DetalleCampo label="Producto desde" value={formatDate(producto.created_at)} />

          {/* Reactivar cuando exista control de stock real:
          <DetalleCampo label="Stock actual" value={producto.stock_actual} mono />
          <DetalleCampo label="Stock mínimo" value={producto.stock_minimo} mono />
          */}
        </div>

        <DialogFooter>
          {producto.activo && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmEliminarOpen(true)}
            >
              Eliminar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={confirmEliminarOpen}
        onOpenChange={setConfirmEliminarOpen}
        variant="destructive"
        title={`¿Dar de baja a ${producto.nombre}?`}
        description='No se borra el registro: el producto pasa a "Inactivo" y deja de aparecer en el filtro de activos. Podés reactivarlo después editándolo.'
        confirmLabel="Dar de baja"
        confirmingLabel="Dando de baja…"
        isPending={eliminarMutation.isPending}
        onConfirm={() => eliminarMutation.mutate()}
      />
    </Dialog>
  )
}

function DetalleCampo({ label, value, mono = false, span2 = false }) {
  return (
    <div className={span2 ? 'col-span-2 flex flex-col gap-0.5' : 'flex flex-col gap-0.5'}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono-num text-sm' : 'text-sm'}>{value || '—'}</span>
    </div>
  )
}