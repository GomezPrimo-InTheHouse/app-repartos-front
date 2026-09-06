import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { fetchClientes } from '@/api/clientes'
import { getApiErrorMessage } from '@/api/client'
import { crearPago } from '@/api/pagos'
import { descargarComprobantePago } from '@/api/reportes'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/format'
import { SaldoValor } from '@/components/clientes/SaldoValor'

const METODOS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'otro', label: 'Otro' },
]

const estadoInicial = {
  clienteId: '',
  monto: '',
  metodo: 'efectivo',
  notas: '',
}

export function NuevoPagoDialog({ trigger }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(estadoInicial)
  const [pagoCreado, setPagoCreado] = useState(null)
  const queryClient = useQueryClient()

  const { data: clientes } = useQuery({
    queryKey: ['clientes', { activo: true, paraSelector: true }],
    queryFn: () => fetchClientes({ activo: true }),
    enabled: open,
  })

  const clienteSeleccionado = clientes?.find((c) => c.id === form.clienteId)

  function resetEstado() {
    setForm(estadoInicial)
    setPagoCreado(null)
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen) resetEstado()
    setOpen(nextOpen)
  }

  const mutation = useMutation({
    mutationFn: () =>
      crearPago({
        cliente_id: form.clienteId,
        monto: Number(form.monto),
        metodo: form.metodo,
        notas: form.notas || undefined,
      }),
    onSuccess: (pago) => {
      toast.success(`Pago de ${formatCurrency(pago.monto)} registrado`)
      queryClient.invalidateQueries({ queryKey: ['pagos'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setPagoCreado({ id: pago.id, clienteNombre: clienteSeleccionado.nombre })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar el pago'))
    },
  })

  const comprobanteMutation = useMutation({
    mutationFn: () => descargarComprobantePago(pagoCreado.id, pagoCreado.clienteNombre),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo generar el comprobante'))
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.clienteId) {
      toast.error('Elegí un cliente')
      return
    }
    const monto = Number(form.monto)
    if (!monto || monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }
    mutation.mutate()
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        {!pagoCreado ? (
          <>
            <DialogHeader>
              <DialogTitle>Nuevo pago</DialogTitle>
              <DialogDescription>Registrá un pago recibido de un cliente.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pago-cliente">Cliente</Label>
                <Select value={form.clienteId} onValueChange={(value) => updateField('clienteId', value)}>
                  <SelectTrigger id="pago-cliente">
                    <SelectValue placeholder="Elegí un cliente…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes?.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {clienteSeleccionado && (
                <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Saldo actual</span>
                  <SaldoValor saldo={clienteSeleccionado.saldo} />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pago-monto">Monto</Label>
                <Input
                  id="pago-monto"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={form.monto}
                  onChange={(e) => updateField('monto', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pago-metodo">Método</Label>
                <Select value={form.metodo} onValueChange={(value) => updateField('metodo', value)}>
                  <SelectTrigger id="pago-metodo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METODOS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pago-notas">Notas</Label>
                <Textarea
                  id="pago-notas"
                  value={form.notas}
                  onChange={(e) => updateField('notas', e.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Registrando…' : 'Registrar pago'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Pago registrado</DialogTitle>
              <DialogDescription>
                El pago de {pagoCreado.clienteNombre} se registró correctamente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => comprobanteMutation.mutate()}
                disabled={comprobanteMutation.isPending}
              >
                <FileText className="size-4" />
                {comprobanteMutation.isPending ? 'Generando…' : 'Ver/descargar comprobante'}
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}