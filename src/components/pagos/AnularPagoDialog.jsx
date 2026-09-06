import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/api/client'
import { anularPago } from '@/api/pagos'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/format'

/**
 * Anulación de pago con motivo obligatorio en el frontend (igual que
 * despachos). No hay "detalle" de pago propiamente dicho —GET /pagos/:id
 * no existe—, así que esto es un dialog de confirmación con formulario,
 * no un dialog de "ver" que además anula.
 */
export function AnularPagoDialog({ pago, trigger }) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const queryClient = useQueryClient()

  function handleOpenChange(nextOpen) {
    if (!nextOpen) setMotivo('')
    setOpen(nextOpen)
  }

  const mutation = useMutation({
    mutationFn: () => anularPago({ id: pago.id, motivo }),
    onSuccess: () => {
      toast.success('Pago anulado')
      queryClient.invalidateQueries({ queryKey: ['pagos'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo anular el pago'))
    },
  })

  function handleConfirmar() {
    if (!motivo.trim()) {
      toast.error('Ingresá un motivo para anular el pago')
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Anular este pago?</DialogTitle>
          <DialogDescription>
            {pago.cliente_nombre} — {formatCurrency(pago.monto)}. El pago deja de contar para el saldo
            del cliente, pero queda en el historial marcado como anulado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="motivo-anulacion-pago">Motivo de la anulación</Label>
          <Textarea
            id="motivo-anulacion-pago"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: error de carga, monto incorrecto…"
            disabled={mutation.isPending}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirmar} disabled={mutation.isPending}>
            {mutation.isPending ? 'Anulando…' : 'Confirmar anulación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}