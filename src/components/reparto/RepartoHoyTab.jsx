import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/api/client'
import { actualizarItemEjecucion, completarEjecucion, fetchRepartoHoy } from '@/api/repartos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Fila de un cliente dentro de una ejecución. Mantiene su propio estado
 * local de cantidades reales (arranca pre-cargado con la cantidad
 * estimada, editable), independiente del checkbox "Visitado" — son dos
 * acciones separadas, tal como se definió.
 */
function ClienteItemCard({ ejecucionId, item }) {
  const [cantidades, setCantidades] = useState(() =>
    Object.fromEntries(
      item.productos.map((p) => [
        p.producto_id,
        String(p.cantidad_real ?? p.cantidad_estimada ?? 0),
      ])
    )
  )
  const queryClient = useQueryClient()

  const visitarMutation = useMutation({
    mutationFn: (visitado) => actualizarItemEjecucion({ ejecucionId, itemId: item.id, visitado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repartos', 'hoy'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo actualizar'))
    },
  })

  const guardarCantidadesMutation = useMutation({
    mutationFn: () =>
      actualizarItemEjecucion({
        ejecucionId,
        itemId: item.id,
        productos: item.productos.map((p) => ({
          producto_id: p.producto_id,
          cantidad_real: Number(cantidades[p.producto_id]) || 0,
        })),
      }),
    onSuccess: () => {
      toast.success(`Cantidades de ${item.cliente_nombre} guardadas`)
      queryClient.invalidateQueries({ queryKey: ['repartos', 'hoy'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudieron guardar las cantidades'))
    },
  })

  function actualizarCantidad(productoId, valor) {
    setCantidades((prev) => ({ ...prev, [productoId]: valor }))
  }

  return (
    <div className={`flex flex-col gap-2 rounded-md border p-3 ${item.visitado ? 'border-success bg-success-soft' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={item.visitado}
            onChange={(e) => visitarMutation.mutate(e.target.checked)}
            disabled={visitarMutation.isPending}
            className="size-4 rounded border-border"
          />
          {item.cliente_nombre}
        </label>
        {item.visitado && <Badge variant="success">Visitado</Badge>}
      </div>

      <div className="flex flex-col gap-1.5 pl-6">
        {item.productos.map((producto) => (
          <div key={producto.producto_id} className="flex items-center gap-2 text-sm">
            <span className="flex-1 text-muted-foreground">
              {producto.producto_nombre}
              <span className="ml-1 text-xs">(estimado: {producto.cantidad_estimada})</span>
            </span>
            <Input
              type="number"
              min="0"
              inputMode="numeric"
              className="w-20"
              value={cantidades[producto.producto_id]}
              onChange={(e) => actualizarCantidad(producto.producto_id, e.target.value)}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1 self-start"
          onClick={() => guardarCantidadesMutation.mutate()}
          disabled={guardarCantidadesMutation.isPending}
        >
          {guardarCantidadesMutation.isPending ? 'Guardando…' : 'Guardar cantidades'}
        </Button>
      </div>
    </div>
  )
}

function EjecucionCard({ ejecucion }) {
  const queryClient = useQueryClient()

  const completarMutation = useMutation({
    mutationFn: () => completarEjecucion(ejecucion.id),
    onSuccess: () => {
      toast.success(`"${ejecucion.lista_nombre}" marcado como completado`)
      queryClient.invalidateQueries({ queryKey: ['repartos', 'hoy'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo completar el reparto'))
    },
  })

  const visitados = ejecucion.items.filter((i) => i.visitado).length

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-base font-semibold">{ejecucion.lista_nombre}</p>
          <p className="text-xs text-muted-foreground">
            {visitados} de {ejecucion.items.length} visitados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={ejecucion.estado === 'completado' ? 'success' : 'outline'}>
            {ejecucion.estado === 'completado' ? 'Completado' : 'Pendiente'}
          </Badge>
          {ejecucion.estado !== 'completado' && (
            <Button
              type="button"
              size="sm"
              onClick={() => completarMutation.mutate()}
              disabled={completarMutation.isPending}
            >
              {completarMutation.isPending ? 'Cerrando…' : 'Cerrar reparto'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {ejecucion.items
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map((item) => (
            <ClienteItemCard key={item.id} ejecucionId={ejecucion.id} item={item} />
          ))}
      </div>
    </div>
  )
}

export function RepartoHoyTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['repartos', 'hoy'],
    queryFn: () => fetchRepartoHoy(),
  })

  return (
    <div className="flex flex-col gap-4">
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
        <EjecucionCard key={ejecucion.id} ejecucion={ejecucion} />
      ))}
    </div>
  )
}