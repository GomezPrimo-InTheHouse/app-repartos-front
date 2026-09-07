import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { fetchClientes } from '@/api/clientes'
import { getApiErrorMessage } from '@/api/client'
import {
  actualizarLista, agregarItemLista, crearLista, eliminarItemLista,
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
    return { nombre: '', tipo: 'semanal', diaSemana: 'lunes', fecha: '', clientesSeleccionados: [] }
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
    })),
  }
}

/**
 * Alta/edición de una plantilla de reparto — SOLO define qué clientes
 * visitar y en qué orden. Ya no maneja productos ni cantidades estimadas
 * (esas se calculan automáticamente desde los despachos reales del día,
 * ver addendum "cantidad_real automática").
 *
 * Soporta modo controlado (open/onOpenChange) para poder abrirse
 * programáticamente después de fetchLista(), igual que antes.
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
        { itemId: null, clienteId: cliente.id, clienteNombre: cliente.nombre },
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
        }))
        return crearLista({ ...headerPayload, items })
      }

      await actualizarLista({ id: lista.id, ...headerPayload })

      const clienteIdsActuales = new Set(form.clientesSeleccionados.map((c) => c.clienteId))
      const aEliminar = (lista.items ?? []).filter((original) => !clienteIdsActuales.has(original.cliente_id))
      const aAgregar = form.clientesSeleccionados.filter((c) => !c.itemId)

      await Promise.all([
        ...aEliminar.map((original) => eliminarItemLista({ listaId: lista.id, itemId: original.id })),
        ...aAgregar.map((c, index) =>
          agregarItemLista({ listaId: lista.id, clienteId: c.clienteId, orden: index })
        ),
      ])
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{esEdicion ? 'Editar lista' : 'Nueva lista de reparto'}</DialogTitle>
          <DialogDescription>
            Definí qué clientes visitar y en qué orden. Las cantidades se calculan solas desde los
            despachos reales de cada día.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lista-nombre">Nombre</Label>
            <Input id="lista-nombre" required value={form.nombre}
              onChange={(e) => updateField('nombre', e.target.value)}
              placeholder="Ej: Reparto Lunes Zona Norte" />
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
                <Input id="lista-fecha" type="date" value={form.fecha}
                  onChange={(e) => updateField('fecha', e.target.value)} />
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
                      <SelectItem key={cliente.id} value={cliente.id}>{cliente.nombre}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={handleAgregarCliente}>
                Agregar
              </Button>
            </div>
          </div>

          {form.clientesSeleccionados.length > 0 && (
            <ul className="flex flex-col gap-1">
              {form.clientesSeleccionados.map((cliente, index) => (
                <li
                  key={cliente.clienteId}
                  className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
                >
                  <span>
                    <span className="text-xs text-muted-foreground">{index + 1}.</span>{' '}
                    {cliente.clienteNombre}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuitarCliente(cliente.clienteId)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Quitar ${cliente.clienteNombre}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
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