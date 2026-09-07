import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/api/client'
import { actualizarItemEjecucion, completarEjecucion, fetchRepartoHoy } from '@/api/repartos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/**
 * Vista de SOLO LECTURA del reparto de hoy — el seguimiento (visitado +
 * productos reales) se calcula solo desde los despachos reales del día;
 * las acciones de carga (crear despacho, marcar visitado sin despacho)
 * viven en el dialog "Reparto de hoy" accesible desde el módulo Despachos.
 * Acá solo se puede ver el estado y cerrar el reparto del día.
 */
function ClienteItemRow({ item }) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-md border p-3 ${item.visitado ? 'border-success bg-success-soft' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium">
          {item.cliente_nombre}
          {item.direccion && (
            <span className="font-normal text-muted-foreground"> — {item.direccion}</span>
          )}
        </span>
        <Badge variant={item.visitado ? 'success' : 'outline'} className="shrink-0">
          {item.visitado ? 'Visitado' : 'Pendiente'}
        </Badge>
      </div>

      {item.productos.length > 0 ? (
        <div className="flex flex-col gap-0.5 pl-1 text-xs text-muted-foreground">
          {item.productos.map((p) => (
            <span key={p.producto_id}>{p.producto_nombre} × {p.cantidad}</span>
          ))}
        </div>
      ) : (
        item.visitado && (
          <p className="pl-1 text-xs text-muted-foreground">Visitado sin despacho registrado.</p>
        )
      )}
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
            <Button type="button" size="sm" onClick={() => completarMutation.mutate()} disabled={completarMutation.isPending}>
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
            <ClienteItemRow key={item.id} item={item} />
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
      <p className="text-xs text-muted-foreground">
        Para registrar despachos y marcar visitas, andá al módulo de Despachos → "Reparto de hoy".
        Acá solo se ve el seguimiento.
      </p>

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