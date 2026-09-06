import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { fetchClientes } from '@/api/clientes'
import { getApiErrorMessage } from '@/api/client'
import { fetchProductos } from '@/api/productos'
import {
  agregarItemLista,
  actualizarItemLista,
  actualizarLista,
  crearLista,
  eliminarItemLista,
} from '@/api/repartos'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const DIAS_SEMANA = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
]

function formDesdeLista(lista) {
  if (!lista) {
    return {
      nombre: '',
      tipo: 'semanal',
      diaSemana: 'lunes',
      fecha: '',
      clientesSeleccionados: [],
    }
  }
  return {
    nombre: lista.nombre,
    tipo: lista.tipo,
    diaSemana: lista.dia_semana ?? 'lunes',
    fecha: lista.fecha ?? '',
    clientesSeleccionados: (lista.items ?? []).map((item) => ({
      itemId: item.id,
      clienteId: item.cliente_id,
      clienteNombre: item.cliente_nombre,
      productos: item.productos.map((p) => ({
        productoId: p.producto_id,
        productoNombre: p.producto_nombre,
        cantidadEstimada: String(p.cantidad_estimada ?? 0),
      })),
    })),
  }
}

/**
 * Alta/edición de una plantilla de reparto.
 *
 * Soporta dos modos de apertura, igual que ConfirmDialog:
 * - Con `trigger`: maneja su propio estado open/close (uso normal, "Nueva lista").
 * - Controlado (`open`/`onOpenChange` pasados desde afuera, sin `trigger`):
 *   necesario para "Editar", donde primero hay que traer la lista completa
 *   con fetchLista() y recién ahí abrir el dialog ya con los datos.
 *
 * ALTA: los items viajan directo en el body de POST /listas.
 * EDICIÓN: el backend NO acepta reemplazar items vía PUT /listas/:id (se
 * ignoran silenciosamente) — se comparan contra el estado original y se
 * disparan POST/PUT/DELETE de /listas/:id/items uno por uno.
 */
export function ListaFormDialog({ lista, trigger, open: openControlado, onOpenChange: onOpenChangeControlado }) {
  const esEdicion = Boolean(lista)
  const [openInterno, setOpenInterno] = useState(false)
  const esControlado = openControlado !== undefined
  const open = esControlado ? openControlado : openInterno
  const setOpen = esControlado ? onOpenChangeControlado : setOpenInterno

  const [form, setForm] = useState(() => formDesdeLista(lista))
  const [clienteParaAgregar, setClienteParaAgregar] = useState('')
  const queryClient = useQueryClient()

  const { data: clientes } = useQuery({
    queryKey: ['clientes', { activo: true, paraSelector: true }],
    queryFn: () => fetchClientes({ activo: true }),
    enabled: open,
  })

  const { data: productos } = useQuery({
    queryKey: ['productos', { activo: true, paraSelector: true }],
    queryFn: () => fetchProductos({ activo: true }),
    enabled: open,
  })

  function resetEstado() {
    setForm(formDesdeLista(lista))
    setClienteParaAgregar('')
  }

  function handleOpenChange(nextOpen) {
    if (nextOpen) resetEstado()
    setOpen(nextOpen)
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleAgregarCliente() {
    const cliente = clientes?.find((c) => c.id === clienteParaAgregar)
    if (!cliente) {
      toast.error('Elegí un cliente')
      return
    }
    if (form.clientesSeleccionados.some((c) => c.clienteId === cliente.id)) {
      toast.error('Ese cliente ya está en la lista')
      return
    }
    setForm((prev) => ({
      ...prev,
      clientesSeleccionados: [
        ...prev.clientesSeleccionados,
        { itemId: null, clienteId: cliente.id, clienteNombre: cliente.nombre, productos: [] },
      ],
    }))
    setClienteParaAgregar('')
  }

  function handleQuitarCliente(clienteId) {
    setForm((prev) => ({
      ...prev,
      clientesSeleccionados: prev.clientesSeleccionados.filter((c) => c.clienteId !== clienteId),
    }))
  }

  function handleAgregarProducto(clienteId, productoId) {
    const producto = productos?.find((p) => p.id === productoId)
    if (!producto) return
    setForm((prev) => ({
      ...prev,
      clientesSeleccionados: prev.clientesSeleccionados.map((c) =>
        c.clienteId === clienteId
          ? {
              ...c,
              productos: c.productos.some((p) => p.productoId === productoId)
                ? c.productos
                : [
                    ...c.productos,
                    { productoId: producto.id, productoNombre: producto.nombre, cantidadEstimada: '1' },
                  ],
            }
          : c
      ),
    }))
  }

  function handleCambiarCantidad(clienteId, productoId, cantidad) {
    setForm((prev) => ({
      ...prev,
      clientesSeleccionados: prev.clientesSeleccionados.map((c) =>
        c.clienteId === clienteId
          ? {
              ...c,
              productos: c.productos.map((p) =>
                p.productoId === productoId ? { ...p, cantidadEstimada: cantidad } : p
              ),
            }
          : c
      ),
    }))
  }

  function handleQuitarProducto(clienteId, productoId) {
    setForm((prev) => ({
      ...prev,
      clientesSeleccionados: prev.clientesSeleccionados.map((c) =>
        c.clienteId === clienteId
          ? { ...c, productos: c.productos.filter((p) => p.productoId !== productoId) }
          : c
      ),
    }))
  }

  function productosPayload(cliente) {
    return cliente.productos.map((p) => ({
      producto_id: p.productoId,
      cantidad_estimada: Number(p.cantidadEstimada) || 0,
    }))
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const headerPayload = {
        nombre: form.nombre,
        tipo: form.tipo,
        ...(form.tipo === 'semanal' ? { dia_semana: form.diaSemana } : { fecha: form.fecha }),
      }

      if (!esEdicion) {
        const items = form.clientesSeleccionados.map((c, index) => ({
          cliente_id: c.clienteId,
          orden: index,
          productos: productosPayload(c),
        }))
        return crearLista({ ...headerPayload, items })
      }

      await actualizarLista({ id: lista.id, ...headerPayload })

      const itemIdsOriginales = new Set((lista.items ?? []).map((i) => i.id))
      const clienteIdsActuales = new Set(form.clientesSeleccionados.map((c) => c.clienteId))

      const aEliminar = (lista.items ?? []).filter(
        (original) => !clienteIdsActuales.has(original.cliente_id)
      )
      const eliminarPromises = aEliminar.map((original) =>
        eliminarItemLista({ listaId: lista.id, itemId: original.id })
      )

      const agregarOActualizarPromises = form.clientesSeleccionados.map((c) => {
        if (c.itemId && itemIdsOriginales.has(c.itemId)) {
          return actualizarItemLista({ listaId: lista.id, itemId: c.itemId, productos: productosPayload(c) })
        }
        return agregarItemLista({ listaId: lista.id, clienteId: c.clienteId, orden: 0, productos: productosPayload(c) })
      })

      await Promise.all([...eliminarPromises, ...agregarOActualizarPromises])
    },
    onSuccess: () => {
      toast.success(esEdicion ? 'Lista actualizada' : 'Lista creada')
      queryClient.invalidateQueries({ queryKey: ['repartos', 'listas'] })
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar la lista'))
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.nombre.trim()) {
      toast.error('Ingresá un nombre para la lista')
      return
    }
    if (form.tipo === 'unica' && !form.fecha) {
      toast.error('Elegí una fecha para la lista única')
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{esEdicion ? 'Editar lista' : 'Nueva lista de reparto'}</DialogTitle>
          <DialogDescription>
            Definí qué clientes visitar y cuánto producto llevarles en teoría.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lista-nombre">Nombre</Label>
            <Input
              id="lista-nombre"
              required
              value={form.nombre}
              onChange={(e) => updateField('nombre', e.target.value)}
              placeholder="Ej: Reparto Lunes Zona Norte"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lista-tipo">Tipo</Label>
              <Select value={form.tipo} onValueChange={(value) => updateField('tipo', value)}>
                <SelectTrigger id="lista-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="unica">Única</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.tipo === 'semanal' ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lista-dia">Día</Label>
                <Select value={form.diaSemana} onValueChange={(value) => updateField('diaSemana', value)}>
                  <SelectTrigger id="lista-dia">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lista-fecha">Fecha</Label>
                <Input
                  id="lista-fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => updateField('fecha', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-border p-3">
            <Label>Agregar cliente</Label>
            <div className="flex gap-2">
              <Select value={clienteParaAgregar} onValueChange={setClienteParaAgregar}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Elegí un cliente…" />
                </SelectTrigger>
                <SelectContent>
                  {clientes
                    ?.filter((c) => !form.clientesSeleccionados.some((s) => s.clienteId === c.id))
                    .map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={handleAgregarCliente}>
                Agregar
              </Button>
            </div>
          </div>

          {form.clientesSeleccionados.length > 0 && (
            <div className="flex flex-col gap-3">
              {form.clientesSeleccionados.map((cliente) => (
                <div key={cliente.clienteId} className="flex flex-col gap-2 rounded-md bg-muted p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{cliente.clienteNombre}</span>
                    <button
                      type="button"
                      onClick={() => handleQuitarCliente(cliente.clienteId)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Quitar ${cliente.clienteNombre}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {cliente.productos.map((producto) => (
                    <div key={producto.productoId} className="flex items-center gap-2 pl-3 text-sm">
                      <span className="flex-1 text-muted-foreground">{producto.productoNombre}</span>
                      <Input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        className="w-20"
                        value={producto.cantidadEstimada}
                        onChange={(e) =>
                          handleCambiarCantidad(cliente.clienteId, producto.productoId, e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => handleQuitarProducto(cliente.clienteId, producto.productoId)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Quitar ${producto.productoNombre}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}

                  <Select value="" onValueChange={(value) => handleAgregarProducto(cliente.clienteId, value)}>
                    <SelectTrigger className="ml-3 w-56">
                      <SelectValue placeholder="+ Agregar producto…" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos
                        ?.filter((p) => !cliente.productos.some((cp) => cp.productoId === p.id))
                        .map((producto) => (
                          <SelectItem key={producto.id} value={producto.id}>
                            {producto.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear lista'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}