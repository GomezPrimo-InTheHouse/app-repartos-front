import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Crosshair, MapPin, Search, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Marker } from 'react-leaflet'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/api/client'
import { buscarDireccion, guardarUbicacionCliente } from '@/api/geolocalizacion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { obtenerPosicionActual } from '@/lib/geolocalizacion'
import { iconoSeleccion } from './iconos'
import { AlTocarMapa, CentrarEn, Mapa } from './MapaBase'

/**
 * Ubica a un cliente de tres formas: buscando su dirección, tocando el mapa (origen 'manual') o con el
 * GPS del celular parado en la puerta (origen 'gps'). El pin se puede arrastrar para corregir.
 * Si ya tenía ubicación, se puede quitar.
 */
export function UbicarClienteDialog({ cliente, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
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
  const [direccion, setDireccion] = useState(cliente.direccion ?? '')
  const [localidad, setLocalidad] = useState(cliente.localidad ?? '')
  const [buscando, setBuscando] = useState(false)
  // null = todavía no buscó; [] = buscó y no encontró
  const [resultados, setResultados] = useState(null)
  const [aproximada, setAproximada] = useState(false)
  const queryClient = useQueryClient()

  function elegirResultado(r) {
    setPunto([r.latitud, r.longitud])
    setOrigen('manual')
    setAproximada(!r.exacta)
  }

  // Se busca solo al confirmar (botón o Enter): el servicio gratuito no permite buscar mientras se escribe.
  async function buscar(event) {
    event.preventDefault()
    if (direccion.trim().length < 3) {
      toast.error('Escribí la calle y la altura')
      return
    }
    setBuscando(true)
    try {
      const data = await buscarDireccion({ direccion: direccion.trim(), localidad: localidad.trim() })
      if (!localidad.trim()) setLocalidad(data.localidad)
      setResultados(data.resultados)
      if (data.resultados.length === 1) elegirResultado(data.resultados[0])
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo buscar la dirección'))
    } finally {
      setBuscando(false)
    }
  }

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
      setAproximada(false)
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
          Buscá la dirección, tocá el mapa donde está la casa o usá tu ubicación si estás en la puerta.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={buscar} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={direccion} onChange={(e) => setDireccion(e.target.value)}
            placeholder="Calle y altura, ej: Bolívar 1313" aria-label="Dirección" className="sm:flex-[2]" />
          <Input value={localidad} onChange={(e) => setLocalidad(e.target.value)}
            placeholder="Ciudad (la de tus clientes)" aria-label="Ciudad" className="sm:flex-1" />
        </div>
        <Button type="submit" variant="outline" disabled={buscando}>
          <Search className="size-4" />
          {buscando ? 'Buscando…' : 'Buscar dirección'}
        </Button>
      </form>

      {resultados?.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No se encontró esa dirección. Probá sin el barrio o con otra forma de escribir la calle, o marcá el punto en el mapa.
        </p>
      )}
      {resultados?.length > 1 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Elegí el resultado correcto:</p>
          {resultados.map((r) => {
            const elegido = punto && punto[0] === r.latitud && punto[1] === r.longitud
            return (
              <button key={`${r.latitud},${r.longitud}`} type="button" onClick={() => elegirResultado(r)}
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${elegido ? 'border-primary bg-secondary' : 'border-border hover:bg-secondary'}`}>
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span className="flex-1">{r.etiqueta}</span>
                {!r.exacta && <span className="shrink-0 text-xs text-muted-foreground">aprox.</span>}
              </button>
            )
          })}
        </div>
      )}
      {aproximada && (
        <p className="flex items-start gap-1.5 rounded-md bg-warning-soft px-3 py-2 text-xs text-foreground">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
          Ubicación aproximada: el mapa no tiene esa altura exacta y marcó la calle. Arrastrá el pin hasta la casa.
        </p>
      )}

      <Button type="button" variant="outline" onClick={usarMiUbicacion} disabled={buscandoGps}>
        <Crosshair className="size-4" />
        {buscandoGps ? 'Buscando señal…' : 'Usar mi ubicación actual'}
      </Button>

      <Mapa className="h-72 sm:h-80" center={punto ?? undefined} zoom={punto ? 17 : undefined}>
        <AlTocarMapa
          onClick={({ lat, lng }) => {
            setPunto([lat, lng])
            setOrigen('manual')
            setAproximada(false)
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
                  setAproximada(false)
                },
              }}
            />
          </>
        )}
      </Mapa>

      <p className="text-xs text-muted-foreground">
        {punto
          ? `Punto elegido${origen === 'gps' ? ' con GPS' : ''}. Podés arrastrar el pin o tocar el mapa para ajustarlo.`
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