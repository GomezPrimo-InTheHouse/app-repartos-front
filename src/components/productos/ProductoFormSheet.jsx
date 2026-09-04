import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { actualizarProducto, crearProducto } from '@/api/productos'
import { getApiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const camposIniciales = {
  nombre: '',
  categoria: '',
  costo_unitario: '0',
  precio_venta: '0',
  stock_minimo: '0',
  imagen_url: '',
  maneja_envase: false,
  activo: 'true',
}

function formDesdeProducto(producto) {
  if (!producto) return camposIniciales
  return {
    nombre: producto.nombre ?? '',
    categoria: producto.categoria ?? '',
    costo_unitario: String(producto.costo_unitario ?? 0),
    precio_venta: String(producto.precio_venta ?? 0),
    stock_minimo: String(producto.stock_minimo ?? 0),
    imagen_url: producto.imagen_url ?? '',
    maneja_envase: producto.maneja_envase ?? false,
    activo: producto.activo ? 'true' : 'false',
  }
}

export function ProductoFormSheet({ producto, trigger }) {
  const esEdicion = Boolean(producto)
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [form, setForm] = useState(() => formDesdeProducto(producto))
  const queryClient = useQueryClient()

  function handleOpenChange(nextOpen) {
    if (nextOpen) setForm(formDesdeProducto(producto))
    setOpen(nextOpen)
  }

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        nombre: form.nombre,
        categoria: form.categoria || null,
        costo_unitario: Number(form.costo_unitario) || 0,
        precio_venta: Number(form.precio_venta) || 0,
        stock_minimo: Number(form.stock_minimo) || 0,
        imagen_url: form.imagen_url || null,
        maneja_envase: form.maneja_envase,
      }
      if (esEdicion) {
        payload.activo = form.activo === 'true'
      }
      return esEdicion ? actualizarProducto({ id: producto.id, ...payload }) : crearProducto(payload)
    },
    onSuccess: () => {
      toast.success(esEdicion ? 'Producto actualizado' : 'Producto creado')
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setConfirmOpen(false)
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el producto'))
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    if (esEdicion) {
      setConfirmOpen(true)
    } else {
      mutation.mutate()
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{esEdicion ? 'Editar producto' : 'Nuevo producto'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-nombre">Nombre</Label>
            <Input id="prod-nombre" required value={form.nombre}
              onChange={(e) => updateField('nombre', e.target.value)} placeholder="Nombre del producto" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-categoria">Categoría</Label>
            <Input id="prod-categoria" value={form.categoria}
              onChange={(e) => updateField('categoria', e.target.value)}
              placeholder="Opcional — texto libre" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-costo">Costo unitario</Label>
              <Input id="prod-costo" type="number" min="0" step="0.01" inputMode="decimal"
                value={form.costo_unitario}
                onChange={(e) => updateField('costo_unitario', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-precio">Precio de venta</Label>
              <Input id="prod-precio" type="number" min="0" step="0.01" inputMode="decimal"
                value={form.precio_venta}
                onChange={(e) => updateField('precio_venta', e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-imagen">URL de imagen</Label>
            <Input id="prod-imagen" value={form.imagen_url}
              onChange={(e) => updateField('imagen_url', e.target.value)}
              placeholder="Opcional — todavía no hay subida de imagen, solo URL" />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="prod-envase"
              type="checkbox"
              checked={form.maneja_envase}
              onChange={(e) => updateField('maneja_envase', e.target.checked)}
              className="size-4 rounded border-border"
            />
            <Label htmlFor="prod-envase" className="cursor-pointer font-normal">
              Maneja envase retornable (sifón, bidón)
            </Label>
          </div>

          {esEdicion && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-activo">Estado</Label>
              <Select value={form.activo} onValueChange={(value) => updateField('activo', value)}>
                <SelectTrigger id="prod-activo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sección avanzada: no relevante para la operación diaria mientras
              no exista un módulo de fabricación/lotes. Se mantiene oculto en
              un bloque aparte, con valor por defecto 0, listo para reactivar
              como feature completa a futuro (ver addendum de Despachos). */}
          <details className="rounded-md border border-border">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground">
              Avanzado (uso futuro)
            </summary>
            <div className="flex flex-col gap-1.5 border-t border-border p-3">
              <Label htmlFor="prod-stock-min">Stock mínimo</Label>
              <Input id="prod-stock-min" type="number" min="0" inputMode="numeric"
                value={form.stock_minimo}
                onChange={(e) => updateField('stock_minimo', e.target.value)} />
              <p className="text-xs text-muted-foreground">
                No tiene efecto operativo por ahora — el sistema no controla stock en los despachos.
                Queda preparado para cuando exista un módulo de fabricación.
              </p>
            </div>
          </details>

          <Button type="submit" disabled={mutation.isPending} className="mt-2">
            {mutation.isPending ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </form>
      </SheetContent>

      {esEdicion && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          variant="default"
          title="¿Guardar los cambios?"
          description={`Se van a actualizar los datos de ${producto.nombre}.`}
          confirmLabel="Guardar cambios"
          confirmingLabel="Guardando…"
          isPending={mutation.isPending}
          onConfirm={() => mutation.mutate()}
        />
      )}
    </Sheet>
  )
}