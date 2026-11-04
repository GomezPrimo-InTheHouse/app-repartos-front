import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/api/client'
import { reordenarLista } from '@/api/repartos'
import { Button } from '@/components/ui/button'
import { ControlPosicion } from '@/components/reparto/ControlPosicion'
import { moverElemento } from '@/lib/orden'

/** ¿Se puede ordenar este reparto? Solo si no está cerrado y tiene más de un cliente. */
function sePuedeOrdenar(ejecucion) {
  return ejecucion.estado !== 'completado' && ejecucion.items.length > 1
}

/** Botón "Ordenar recorrido". Se oculta solo si el reparto no se puede ordenar. */
export function BotonOrdenarRecorrido({ ejecucion, onClick }) {
  if (!sePuedeOrdenar(ejecucion)) return null
  return (
    <Button type="button" variant="ghost" size="sm" className="px-2" onClick={onClick}>
      <ArrowUpDown className="size-4" />
      Ordenar recorrido
    </Button>
  )
}

/**
 * Editor del orden de visita de un reparto del día: flechas o posición por cliente.
 * Al guardar, el orden queda en la LISTA (el próximo reparto ya sale así) y se aplica
 * también al reparto de hoy. Lo usan "Reparto de hoy" de Despachos y la pestaña del módulo Reparto.
 * `itemsOrdenados`: los clientes en el orden actual. `onClose`: vuelve al modo normal.
 */
export function OrdenarRecorrido({ ejecucion, itemsOrdenados, onClose }) {
  const queryClient = useQueryClient()
  const [borrador, setBorrador] = useState(itemsOrdenados)

  const mutation = useMutation({
    mutationFn: () =>
      reordenarLista({
        listaId: ejecucion.lista_reparto_id,
        clienteIds: borrador.map((item) => item.cliente_id),
      }),
    onSuccess: () => {
      toast.success('Orden del recorrido guardado')
      queryClient.invalidateQueries({ queryKey: ['repartos'] })
      // El Mapa numera a los clientes según el orden de la lista
      queryClient.invalidateQueries({ queryKey: ['geolocalizacion', 'clientes'] })
      onClose()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo guardar el orden')),
  })

  const huboCambios = borrador.some((item, i) => item.id !== itemsOrdenados[i]?.id)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Poné a los clientes en el orden en que los visitás en la calle. El orden se guarda en la lista
        y se usa también en los próximos repartos.
      </p>
      <ul className="flex flex-col gap-1">
        {borrador.map((item, index) => (
          <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2">
            <span className="min-w-0 flex-1 text-sm">
              <span className="block truncate font-medium">
                <span className="text-xs font-normal text-muted-foreground">{index + 1}.</span>{' '}
                {item.cliente_nombre}
              </span>
              {item.direccion && (
                <span className="block truncate text-xs text-muted-foreground">{item.direccion}</span>
              )}
            </span>
            <ControlPosicion
              index={index}
              total={borrador.length}
              nombre={item.cliente_nombre}
              onMover={(hasta) => setBorrador((prev) => moverElemento(prev, index, hasta))}
              disabled={mutation.isPending}
            />
          </li>
        ))}
      </ul>
      <div className="sticky bottom-0 flex justify-end gap-2 bg-background py-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={() => mutation.mutate()} disabled={!huboCambios || mutation.isPending}>
          {mutation.isPending ? 'Guardando…' : 'Guardar orden'}
        </Button>
      </div>
    </div>
  )
}