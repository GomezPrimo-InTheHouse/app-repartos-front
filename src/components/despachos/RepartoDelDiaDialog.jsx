import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpDown, MapPin } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/api/client'
import { actualizarItemEjecucion, fetchRepartoHoy, reordenarLista } from '@/api/repartos'
import { guardarUbicacionCliente } from '@/api/geolocalizacion'
import { useAuth } from '@/hooks/useAuth'
import { obtenerPosicionActual } from '@/lib/geolocalizacion'
import { moverElemento } from '@/lib/orden'
import { ControlPosicion } from '@/components/reparto/ControlPosicion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { NuevoDespachoDialog } from '@/components/despachos/NuevoDespachoDialog'

function ClienteFila({ ejecucionId, item, numero }) {
  const [despachoDialogOpen, setDespachoDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const { usaGeolocalizacion } = useAuth()

  // "Estoy en la puerta": guarda el GPS del celular como ubicación del cliente.
  const ubicarMutation = useMutation({
    mutationFn: async () => {
      const pos = await obtenerPosicionActual({ maximumAge: 0 })
      await guardarUbicacionCliente({
        clienteId: item.cliente_id,
        latitud: pos.latitud,
        longitud: pos.longitud,
        origen: 'gps',
      })
      return pos
    },
    onSuccess: (pos) => {
      toast.success(
        pos.precision > 50
          ? `Ubicación guardada con precisión baja (±${Math.round(pos.precision)} m). Podés ajustarla en el Mapa.`
          : `Ubicación de ${item.cliente_nombre} guardada`
      )
      queryClient.invalidateQueries({ queryKey: ['repartos', 'hoy'] })
      queryClient.invalidateQueries({ queryKey: ['geolocalizacion'] })
    },
    onError: (error) => {
      toast.error(error?.response ? getApiErrorMessage(error, 'No se pudo guardar la ubicación') : error.message)
    },
  })

  const marcarVisitadoMutation = useMutation({
    mutationFn: () => actualizarItemEjecucion({ ejecucionId, itemId: item.id, visitado: true }),
    onSuccess: () => {
      toast.success(`${item.cliente_nombre} marcado como visitado`)
      queryClient.invalidateQueries({ queryKey: ['repartos', 'hoy'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo marcar como visitado'))
    },
  })

  return (
    <div className={`flex flex-col gap-2 rounded-md border p-3 ${item.visitado ? 'border-success bg-success-soft' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium">
          <span className="text-xs font-normal text-muted-foreground">{numero}.</span>{' '}
          {item.cliente_nombre}
          {item.direccion && (
            <span className="font-normal text-muted-foreground"> — {item.direccion}</span>
          )}
        </span>
        <Badge variant={item.visitado ? 'success' : 'outline'} className="shrink-0">
          {item.visitado ? 'Visitado' : 'Pendiente'}
        </Badge>
      </div>

      {item.productos.length > 0 && (
        <div className="flex flex-col gap-0.5 pl-1 text-xs text-muted-foreground">
          {item.productos.map((p) => (
            <span key={p.producto_id}>{p.producto_nombre} × {p.cantidad}</span>
          ))}
        </div>
      )}

      {!item.visitado && (
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={() => setDespachoDialogOpen(true)}>
            Nuevo despacho
          </Button>
          <Button
            type="button" variant="outline" size="sm"
            onClick={() => marcarVisitadoMutation.mutate()}
            disabled={marcarVisitadoMutation.isPending}
          >
            {marcarVisitadoMutation.isPending ? 'Guardando…' : 'Visitado sin despacho'}
          </Button>
        </div>
      )}

      {usaGeolocalizacion && !item.ubicado && (
        <Button
          type="button" variant="ghost" size="sm" className="self-start px-2 text-muted-foreground"
          onClick={() => ubicarMutation.mutate()}
          disabled={ubicarMutation.isPending}
        >
          <MapPin className="size-4" />
          {ubicarMutation.isPending ? 'Buscando señal…' : 'Estoy en la puerta: guardar ubicación'}
        </Button>
      )}

      <NuevoDespachoDialog
        open={despachoDialogOpen}
        onOpenChange={setDespachoDialogOpen}
        clienteIdInicial={item.cliente_id}
        clienteNombreInicial={item.cliente_nombre}
        clienteAumentoInicial={item.porcentaje_aumento}
      />
    </div>
  )
}

/**
 * Un reparto (una lista) del día. Tiene dos modos:
 *  - normal: el repartidor registra despachos y visitas;
 *  - "Ordenar recorrido": mueve clientes con flechas o eligiendo la posición, y al guardar el
 *    orden queda en la LISTA (así el próximo reparto ya sale en el orden de la calle) y se
 *    aplica también a este reparto.
 */
function EjecucionBloque({ ejecucion }) {
  const queryClient = useQueryClient()
  const itemsOrdenados = ejecucion.items.slice().sort((a, b) => a.orden - b.orden)
  // null = modo normal; array = borrador del orden mientras se reordena
  const [borrador, setBorrador] = useState(null)
  const ordenando = borrador !== null
  const puedeOrdenar = ejecucion.estado !== 'completado' && itemsOrdenados.length > 1

  const mutation = useMutation({
    mutationFn: () =>
      reordenarLista({
        listaId: ejecucion.lista_reparto_id,
        clienteIds: borrador.map((item) => item.cliente_id),
      }),
    onSuccess: () => {
      toast.success('Orden del recorrido guardado')
      setBorrador(null)
      queryClient.invalidateQueries({ queryKey: ['repartos'] })
      queryClient.invalidateQueries({ queryKey: ['geolocalizacion', 'clientes'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo guardar el orden')),
  })

  const huboCambios =
    ordenando && borrador.some((item, i) => item.id !== itemsOrdenados[i]?.id)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{ejecucion.lista_nombre}</p>
        {puedeOrdenar && !ordenando && (
          <Button type="button" variant="ghost" size="sm" className="px-2" onClick={() => setBorrador(itemsOrdenados)}>
            <ArrowUpDown className="size-4" />
            Ordenar recorrido
          </Button>
        )}
      </div>

      {ordenando ? (
        <>
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
            <Button type="button" variant="ghost" size="sm" onClick={() => setBorrador(null)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={() => mutation.mutate()} disabled={!huboCambios || mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : 'Guardar orden'}
            </Button>
          </div>
        </>
      ) : (
        itemsOrdenados.map((item, index) => (
          <ClienteFila key={item.id} ejecucionId={ejecucion.id} item={item} numero={index + 1} />
        ))
      )}
    </div>
  )
}

/**
 * Dialog "Reparto de hoy" accesible desde Despachos — es la pantalla donde
 * el repartidor realmente trabaja: ve la lista de clientes a visitar, y
 * para cada uno crea el despacho real o lo marca visitado sin venta.
 * El seguimiento (visitado + productos reales) se recalcula solo, sin
 * cargar nada manualmente aparte de estas dos acciones.
 */
export function RepartoDelDiaDialog({ trigger }) {
  const [open, setOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['repartos', 'hoy'],
    queryFn: () => fetchRepartoHoy(),
    enabled: open,
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reparto de hoy</DialogTitle>
          <DialogDescription>
            Registrá el despacho de cada cliente a medida que los vayas visitando.
          </DialogDescription>
        </DialogHeader>

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
          <EjecucionBloque key={ejecucion.id} ejecucion={ejecucion} />
        ))}
      </DialogContent>
    </Dialog>
  )
}