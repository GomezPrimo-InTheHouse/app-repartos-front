import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Crosshair } from 'lucide-react'
import { useState } from 'react'
import { Marker } from 'react-leaflet'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/api/client'
import { guardarUbicacionCliente } from '@/api/geolocalizacion'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { obtenerPosicionActual } from '@/lib/geolocalizacion'
import { iconoSeleccion } from './iconos'
import { AlTocarMapa, CentrarEn, Mapa } from './MapaBase'

/**
 * Ubica a un cliente: tocando el mapa (origen 'manual') o con el GPS del celular parado en la puerta
 * (origen 'gps'). El pin se puede arrastrar para corregir. Si ya tenía ubicación, se puede quitar.
 */
export function UbicarClienteDialog({ cliente, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {cliente && <Contenido key={cliente.id} cliente={cliente} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function Contenido({ cliente, onClose }) {
  const tieneUbicacion = cliente.latitud !== null && cliente.latitud !== undefined
  const [punto, setPunto] = useState(tieneUbicacion ? [cliente.latitud, cliente.longitud] : null)
  const [origen, setOrigen] = useState(cliente.ubicacion_origen ?? 'manual')
  const [buscandoGps, setBuscandoGps] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (quitar) =>
      guardarUbicacionCliente({
        clienteId: cliente.id,
        latitud: quitar ? null : punto[0],
        longitud: quitar ? null : punto[1],
        origen,
      }),
    onSuccess: (_, quitar) => {
      toast.success(quitar ? `Se quitó la ubicación de ${cliente.nombre}` : `${cliente.nombre} ubicado en el mapa`)
      queryClient.invalidateQueries({ queryKey: ['geolocalizacion'] })
      queryClient.invalidateQueries({ queryKey: ['repartos', 'hoy'] })
      onClose()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo guardar la ubicación')),
  })

  async function usarMiUbicacion() {
    setBuscandoGps(true)
    try {
      const pos = await obtenerPosicionActual({ maximumAge: 0 })
      setPunto([pos.latitud, pos.longitud])
      setOrigen('gps')
      if (pos.precision > 50) {
        toast.warning(`Precisión baja (±${Math.round(pos.precision)} m). Si podés, corregí el pin a mano.`)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBuscandoGps(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Ubicar a {cliente.nombre}</DialogTitle>
        <DialogDescription>
          {cliente.direccion ? `${cliente.direccion}. ` : ''}Tocá el mapa donde está la casa o usá tu ubicación si estás en la puerta.
        </DialogDescription>
      </DialogHeader>

      <Button type="button" variant="outline" onClick={usarMiUbicacion} disabled={buscandoGps}>
        <Crosshair className="size-4" />
        {buscandoGps ? 'Buscando señal…' : 'Usar mi ubicación actual'}
      </Button>

      <Mapa className="h-72 sm:h-80" center={punto ?? undefined} zoom={punto ? 17 : undefined}>
        <AlTocarMapa
          onClick={({ lat, lng }) => {
            setPunto([lat, lng])
            setOrigen('manual')
          }}
        />
        {punto && (
          <>
            <CentrarEn punto={punto} zoom={17} />
            <Marker
              position={punto}
              icon={iconoSeleccion()}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng()
                  setPunto([lat, lng])
                  setOrigen('manual')
                },
              }}
            />
          </>
        )}
      </Mapa>

      <p className="text-xs text-muted-foreground">
        {punto
          ? `Punto elegido${origen === 'gps' ? ' con GPS' : ''}. Podés arrastrar el pin para ajustarlo.`
          : 'Todavía no elegiste un punto.'}
      </p>

      <DialogFooter className="gap-2">
        {tieneUbicacion && (
          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive sm:mr-auto"
            disabled={mutation.isPending} onClick={() => mutation.mutate(true)}>
            Quitar ubicación
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button type="button" disabled={!punto || mutation.isPending} onClick={() => mutation.mutate(false)}>
          {mutation.isPending ? 'Guardando…' : 'Guardar ubicación'}
        </Button>
      </DialogFooter>
    </>
  )
}