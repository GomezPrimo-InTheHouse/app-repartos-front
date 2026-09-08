import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { fetchClientes, fetchEnvasesCliente } from '@/api/clientes'
import { getApiErrorMessage } from '@/api/client'
import { crearDespacho } from '@/api/despachos'
import { fetchProductos } from '@/api/productos'
import { FEATURE_DEVOLUCION_SIN_PRODUCTO } from '@/config/features'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DevolucionEnvasesSection } from '@/components/despachos/DevolucionEnvasesSection'
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

const estadoInicial = (clienteIdInicial) => ({
  clienteId: clienteIdInicial ?? '',
  productoIdParaAgregar: '',
  cantidadParaAgregar: '1',
  envasesDevueltosParaAgregar: '0',
  items: [],
  // Map { [producto_id]: string } — cantidades a devolver de productos que
  // el cliente NO está comprando en este despacho. Solo se usa si
  // FEATURE_DEVOLUCION_SIN_PRODUCTO está activo.
  envasesDevueltosSueltos: {},
  notas: '',
})

/**
 * Nuevo despacho. Soporta:
 * - Uso normal: trigger propio, cliente elegible libremente.
 * - Uso desde "Reparto de hoy" (Despachos): open/onOpenChange controlados,
 *   clienteIdInicial fijo (el selector de cliente se oculta/bloquea), y
 *   onDespachoCreado(callback) para que el dialog que lo abrió pueda
 *   refrescar su propia lista al confirmar.
 * - Despacho "solo devolución de envases" (sin productos), si
 *   FEATURE_DEVOLUCION_SIN_PRODUCTO está activo — ver
 *   DevolucionEnvasesSection.
 */
export function NuevoDespachoDialog({
  trigger,
  open: openControlado,
  onOpenChange: onOpenChangeControlado,
  clienteIdInicial,
  clienteNombreInicial,
  onDespachoCreado,
}) {
  const [openInterno, setOpenInterno] = useState(false)
  const esControlado = openControlado !== undefined
  const open = esControlado ? openControlado : openInterno
  const setOpen = esControlado ? onOpenChangeControlado : setOpenInterno
  const clienteFijo = Boolean(clienteIdInicial)

  const [estado, setEstado] = useState(() => estadoInicial(clienteIdInicial))
  const queryClient = useQueryClient()

  const { data: clientes } = useQuery({
    queryKey: ['clientes', { activo: true, paraSelector: true }],
    queryFn: () => fetchClientes({ activo: true }),
    enabled: open && !clienteFijo,
  })

  const { data: productos } = useQuery({
    queryKey: ['productos', { activo: true, paraSelector: true }],
    queryFn: () => fetchProductos({ activo: true }),
    enabled: open,
  })

  const { data: envasesCliente } = useQuery({
    queryKey: ['clientes', estado.clienteId, 'envases'],
    queryFn: () => fetchEnvasesCliente(estado.clienteId),
    enabled: open && Boolean(estado.clienteId),
  })

  const clienteSeleccionado = clienteFijo
    ? { id: clienteIdInicial, nombre: clienteNombreInicial }
    : clientes?.find((c) => c.id === estado.clienteId)
  const productoParaAgregar = productos?.find((p) => p.id === estado.productoIdParaAgregar)
  const totalCarrito = estado.items.reduce((acc, item) => acc + item.subtotal, 0)

  const clienteConSaldo = clientes?.find((c) => c.id === estado.clienteId)
  const alertaCreditoPreview =
    clienteConSaldo &&
    clienteConSaldo.limite_credito > 0 &&
    clienteConSaldo.saldo + totalCarrito > clienteConSaldo.limite_credito

  // Productos con saldo de envases > 0 que el cliente NO está comprando en
  // este despacho — son los únicos elegibles para "devolución suelta".
  const envasesDisponiblesParaDevolucionSuelta = (envasesCliente ?? []).filter(
    (e) => e.saldo > 0 && !estado.items.some((i) => i.producto_id === e.producto_id)
  )

  const envasesDevueltosSueltosPayload = Object.entries(estado.envasesDevueltosSueltos)
    .map(([producto_id, cantidad]) => ({ producto_id, cantidad: Number(cantidad) }))
    .filter((e) => e.cantidad > 0)

  const hayDevolucionSuelta = envasesDevueltosSueltosPayload.length > 0
  const esSoloDevolucion = estado.items.length === 0 && hayDevolucionSuelta

  function resetEstado() {
    setEstado(estadoInicial(clienteIdInicial))
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen) resetEstado()
    setOpen(nextOpen)
  }

  function handleAgregarItem() {
    const producto = productoParaAgregar
    const cantidad = Number(estado.cantidadParaAgregar)
    const envasesDevueltos = Number(estado.envasesDevueltosParaAgregar) || 0

    if (!producto) {
      toast.error('Elegí un producto')
      return
    }
    if (!cantidad || cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }
    if (envasesDevueltos < 0) {
      toast.error('Los envases devueltos no pueden ser negativos')
      return
    }

    const itemExistente = estado.items.find((i) => i.producto_id === producto.id)
    const nuevosItems = itemExistente
      ? estado.items.map((i) =>
          i.producto_id === producto.id
            ? {
                ...i,
                cantidad: i.cantidad + cantidad,
                envases_devueltos: (i.envases_devueltos ?? 0) + envasesDevueltos,
                subtotal: (i.cantidad + cantidad) * producto.precio_venta,
              }
            : i
        )
      : [
          ...estado.items,
          {
            producto_id: producto.id,
            nombre: producto.nombre,
            precio_venta: producto.precio_venta,
            maneja_envase: producto.maneja_envase,
            cantidad,
            envases_devueltos: producto.maneja_envase ? envasesDevueltos : undefined,
            subtotal: cantidad * producto.precio_venta,
          },
        ]

    setEstado((prev) => {
      // Si el producto recién agregado tenía una cantidad cargada en
      // "devolución suelta", se descarta: a partir de ahora ese envase se
      // maneja vía el campo del item, no acá (evita contar dos veces el
      // mismo envase devuelto).
      const { [producto.id]: _descartado, ...envasesDevueltosSueltosRestantes } = prev.envasesDevueltosSueltos
      return {
        ...prev,
        items: nuevosItems,
        productoIdParaAgregar: '',
        cantidadParaAgregar: '1',
        envasesDevueltosParaAgregar: '0',
        envasesDevueltosSueltos: envasesDevueltosSueltosRestantes,
      }
    })
  }

  function handleQuitarItem(productoId) {
    setEstado((prev) => ({ ...prev, items: prev.items.filter((i) => i.producto_id !== productoId) }))
  }

  function handleCambiarEnvaseSuelto(productoId, valor) {
    setEstado((prev) => ({
      ...prev,
      envasesDevueltosSueltos: { ...prev.envasesDevueltosSueltos, [productoId]: valor },
    }))
  }

  const mutation = useMutation({
    mutationFn: () =>
      crearDespacho({
        cliente_id: estado.clienteId,
        items: estado.items.map((i) => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          ...(i.maneja_envase ? { envases_devueltos: i.envases_devueltos ?? 0 } : {}),
        })),
        ...(FEATURE_DEVOLUCION_SIN_PRODUCTO && hayDevolucionSuelta
          ? { envases_devueltos_sueltos: envasesDevueltosSueltosPayload }
          : {}),
        notas: estado.notas || undefined,
      }),
    onSuccess: (despacho) => {
      toast.success(
        despacho.tipo === 'solo_devolucion'
          ? 'Devolución de envases registrada'
          : `Despacho #${despacho.numero} creado`
      )
      if (despacho.alerta_credito_al_momento) {
        toast.warning(`${clienteSeleccionado?.nombre ?? 'El cliente'} superó su límite de crédito`)
      }
      queryClient.invalidateQueries({ queryKey: ['despachos'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['repartos', 'hoy'] })
      onDespachoCreado?.(despacho)
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo crear el despacho'))
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    if (!estado.clienteId) {
      toast.error('Elegí un cliente')
      return
    }
    if (estado.items.length === 0 && !(FEATURE_DEVOLUCION_SIN_PRODUCTO && hayDevolucionSuelta)) {
      toast.error('Agregá al menos un producto o una devolución de envases')
      return
    }
    const excedeSaldo = envasesDevueltosSueltosPayload.some((e) => {
      const disponible = envasesDisponiblesParaDevolucionSuelta.find((d) => d.producto_id === e.producto_id)
      return disponible && e.cantidad > disponible.saldo
    })
    if (excedeSaldo) {
      toast.error('Hay una cantidad de envases a devolver mayor a la que tiene el cliente')
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo despacho</DialogTitle>
          <DialogDescription>
            {clienteFijo
              ? `Registrando despacho para ${clienteNombreInicial}.`
              : 'Elegí el cliente y armá el carrito de productos.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!clienteFijo && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="desp-cliente">Cliente</Label>
              <Select
                value={estado.clienteId}
                onValueChange={(value) => setEstado((prev) => ({ ...prev, clienteId: value }))}
              >
                <SelectTrigger id="desp-cliente">
                  <SelectValue placeholder="Elegí un cliente…" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>{cliente.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {alertaCreditoPreview && (
            <div className="rounded-md bg-warning-soft px-3 py-2 text-sm text-foreground">
              ⚠ Este despacho va a superar el límite de crédito de {clienteSeleccionado.nombre}.
            </div>
          )}

          {estado.clienteId && envasesCliente && envasesCliente.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-md border border-border p-3">
              <Label>Envases en poder del cliente</Label>
              {envasesCliente.map((e) => (
                <div key={e.producto_id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{e.producto_nombre}</span>
                  <span className="font-mono-num font-semibold">{e.saldo}</span>
                </div>
              ))}
            </div>
          )}

          {FEATURE_DEVOLUCION_SIN_PRODUCTO && estado.clienteId && (
            <DevolucionEnvasesSection
              envasesDisponibles={envasesDisponiblesParaDevolucionSuelta}
              valores={estado.envasesDevueltosSueltos}
              onChange={handleCambiarEnvaseSuelto}
            />
          )}

          <div className="flex flex-col gap-2 rounded-md border border-border p-3">
            <Label>Agregar producto</Label>
            <div className="flex gap-2">
              <Select
                value={estado.productoIdParaAgregar}
                onValueChange={(value) => setEstado((prev) => ({ ...prev, productoIdParaAgregar: value }))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Producto…" />
                </SelectTrigger>
                <SelectContent>
                  {productos?.map((producto) => (
                    <SelectItem key={producto.id} value={producto.id}>
                      {producto.nombre} — {formatCurrency(producto.precio_venta)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number" min="1" inputMode="numeric" className="w-20"
                value={estado.cantidadParaAgregar}
                onChange={(e) => setEstado((prev) => ({ ...prev, cantidadParaAgregar: e.target.value }))}
              />
              <Button type="button" variant="outline" onClick={handleAgregarItem}>
                Agregar
              </Button>
            </div>

            {productoParaAgregar?.maneja_envase && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="envases-devueltos" className="text-xs text-muted-foreground">
                  Envases vacíos que devuelve el cliente
                </Label>
                <Input
                  id="envases-devueltos" type="number" min="0" inputMode="numeric" className="w-24"
                  value={estado.envasesDevueltosParaAgregar}
                  onChange={(e) => setEstado((prev) => ({ ...prev, envasesDevueltosParaAgregar: e.target.value }))}
                />
              </div>
            )}
          </div>

          {estado.items.length > 0 && (
            <div className="flex flex-col gap-2">
              {estado.items.map((item) => (
                <div key={item.producto_id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{item.nombre}</span>
                    <span className="text-muted-foreground"> × {item.cantidad}</span>
                    {item.maneja_envase && (
                      <Badge variant="outline" className="ml-2">{item.envases_devueltos ?? 0} devueltos</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-num">{formatCurrency(item.subtotal)}</span>
                    <button type="button" onClick={() => handleQuitarItem(item.producto_id)}
                      className="text-muted-foreground hover:text-destructive" aria-label={`Quitar ${item.nombre}`}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                <span>Total</span>
                <span className="font-mono-num">{formatCurrency(totalCarrito)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="desp-notas">Notas</Label>
            <Textarea id="desp-notas" value={estado.notas}
              onChange={(e) => setEstado((prev) => ({ ...prev, notas: e.target.value }))}
              placeholder="Opcional" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? (esSoloDevolucion ? 'Registrando…' : 'Creando…')
                : (esSoloDevolucion ? 'Registrar devolución' : 'Crear despacho')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}