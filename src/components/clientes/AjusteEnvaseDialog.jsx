import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ajustarEnvaseCliente } from '@/api/clientes'
import { getApiErrorMessage } from '@/api/client'
import { fetchProductos } from '@/api/productos'
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

const estadoInicial = {
  productoId: '',
  tipo: 'sumar',
  cantidad: '1',
  motivo: '',
}

/**
 * Ajuste manual de envases para un cliente — pensado para cargar el saldo
 * inicial de clientes que ya tenían envases en su poder antes de usar el
 * sistema, o para correcciones puntuales.
 *
 * Se pide "tipo" (sumar/restar) + cantidad positiva, en vez de un input con
 * signo, para evitar errores de carga en el uso diario en la calle.
 */
export function AjusteEnvaseDialog({ clienteId, clienteNombre, trigger }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(estadoInicial)
  const queryClient = useQueryClient()

  const { data: productos } = useQuery({
    queryKey: ['productos', { activo: true, paraSelector: true }],
    queryFn: () => fetchProductos({ activo: true }),
    enabled: open,
  })

  const productosConEnvase = productos?.filter((p) => p.maneja_envase) ?? []

  function resetEstado() {
    setForm(estadoInicial)
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen) resetEstado()
    setOpen(nextOpen)
  }

  const mutation = useMutation({
    mutationFn: () => {
      const cantidad = Number(form.cantidad)
      return ajustarEnvaseCliente({
        clienteId,
        productoId: form.productoId,
        delta: form.tipo === 'sumar' ? cantidad : -cantidad,
        motivo: form.motivo || undefined,
      })
    },
    onSuccess: (resultado) => {
      toast.success(`Nuevo saldo de ${resultado.producto_nombre}: ${resultado.saldo}`)
      queryClient.invalidateQueries({ queryKey: ['clientes', clienteId, 'envases'] })
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo ajustar el envase'))
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.productoId) {
      toast.error('Elegí un tipo de envase')
      return
    }
    const cantidad = Number(form.cantidad)
    if (!cantidad || cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
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
        <DialogHeader>
          <DialogTitle>Ajustar envases</DialogTitle>
          <DialogDescription>
            Corregí manualmente el saldo de envases de {clienteNombre}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ajuste-producto">Tipo de envase</Label>
            <Select value={form.productoId} onValueChange={(value) => updateField('productoId', value)}>
              <SelectTrigger id="ajuste-producto">
                <SelectValue placeholder="Elegí un tipo…" />
              </SelectTrigger>
              <SelectContent>
                {productosConEnvase.map((producto) => (
                  <SelectItem key={producto.id} value={producto.id}>
                    {producto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {productosConEnvase.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ningún producto tiene marcado "Maneja envase retornable" todavía.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ajuste-tipo">Ajuste</Label>
              <Select value={form.tipo} onValueChange={(value) => updateField('tipo', value)}>
                <SelectTrigger id="ajuste-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sumar">Sumar (tiene más)</SelectItem>
                  <SelectItem value="restar">Restar (devolvió)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ajuste-cantidad">Cantidad</Label>
              <Input id="ajuste-cantidad" type="number" min="1" inputMode="numeric"
                value={form.cantidad} onChange={(e) => updateField('cantidad', e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ajuste-motivo">Motivo</Label>
            <Textarea id="ajuste-motivo" value={form.motivo}
              onChange={(e) => updateField('motivo', e.target.value)}
              placeholder="Ej: envases acumulados de meses anteriores" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : 'Guardar ajuste'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}