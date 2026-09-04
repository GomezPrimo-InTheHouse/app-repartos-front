import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/api/client'
import { anularDespacho, fetchDespacho } from '@/api/despachos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate } from '@/lib/format'

/**
 * "Ver despacho" — trae el detalle completo (con items) recién al abrirse,
 * ya que GET /api/despachos (listado) no incluye items.
 * Incluye la anulación con motivo, exigido en el frontend aunque el backend
 * no lo requiera, por trazabilidad.
 */
export function DespachoDetalleDialog({ despachoId, trigger }) {
  const [open, setOpen] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [mostrarFormAnular, setMostrarFormAnular] = useState(false)
  const queryClient = useQueryClient()

  const { data: despacho, isLoading, isError } = useQuery({
    queryKey: ['despachos', despachoId],
    queryFn: () => fetchDespacho(despachoId),
    enabled: open,
  })

  function resetEstado() {
    setMotivoAnulacion('')
    setMostrarFormAnular(false)
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen) resetEstado()
    setOpen(nextOpen)
  }

  const anularMutation = useMutation({
    mutationFn: () => anularDespacho({ id: despachoId, motivo: motivoAnulacion }),
    onSuccess: () => {
      toast.success('Despacho anulado')
      queryClient.invalidateQueries({ queryKey: ['despachos'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo anular el despacho'))
    },
  })

  function handleConfirmarAnulacion() {
    if (!motivoAnulacion.trim()) {
      toast.error('Ingresá un motivo para anular el despacho')
      return
    }
    anularMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>}
        {isError && (
          <p className="py-6 text-center text-sm text-destructive">No se pudo cargar el despacho.</p>
        )}

        {despacho && (
          <>
            <DialogHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <DialogTitle>Despacho #{despacho.numero}</DialogTitle>
              <Badge variant={despacho.estado === 'entregado' ? 'success' : 'destructive'}>
                {despacho.estado === 'entregado' ? 'Entregado' : 'Anulado'}
              </Badge>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetalleCampo label="Cliente" value={despacho.cliente_nombre} span2 />
              <DetalleCampo label="Fecha" value={formatDate(despacho.fecha)} />
              <DetalleCampo label="Total" value={formatCurrency(despacho.total)} mono />
              {despacho.alerta_credito_al_momento && (
                <DetalleCampo
                  label="Crédito"
                  value={<span className="text-warning">Superó el límite</span>}
                  span2
                />
              )}
              {despacho.notas && <DetalleCampo label="Notas" value={despacho.notas} span2 />}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Productos</Label>
              {despacho.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{item.producto_nombre}</span>
                    <span className="text-muted-foreground"> × {item.cantidad}</span>
                  </div>
                  <span className="font-mono-num">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {despacho.estado === 'anulado' && (
              <div className="rounded-md bg-destructive-soft px-3 py-2 text-sm">
                <p className="font-medium">Anulado el {formatDate(despacho.anulado_at)}</p>
                {despacho.motivo_anulacion && (
                  <p className="text-muted-foreground">Motivo: {despacho.motivo_anulacion}</p>
                )}
              </div>
            )}

            {despacho.estado === 'entregado' && (
              <>
                {!mostrarFormAnular ? (
                  <DialogFooter>
                    <Button type="button" variant="destructive" onClick={() => setMostrarFormAnular(true)}>
                      Anular despacho
                    </Button>
                  </DialogFooter>
                ) : (
                  <div className="flex flex-col gap-2 rounded-md border border-destructive/30 p-3">
                    <Label htmlFor="motivo-anulacion">Motivo de la anulación</Label>
                    <Textarea
                      id="motivo-anulacion"
                      value={motivoAnulacion}
                      onChange={(e) => setMotivoAnulacion(e.target.value)}
                      placeholder="Ej: error de carga, cliente rechazó el pedido…"
                      disabled={anularMutation.isPending}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setMostrarFormAnular(false)}
                        disabled={anularMutation.isPending}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirmarAnulacion}
                        disabled={anularMutation.isPending}
                      >
                        {anularMutation.isPending ? 'Anulando…' : 'Confirmar anulación'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>
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