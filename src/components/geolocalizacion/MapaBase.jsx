import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { cn } from '@/lib/utils'
import { CENTRO_POR_DEFECTO, ZOOM_POR_DEFECTO } from '@/lib/geolocalizacion'

/**
 * Mapa base con OpenStreetMap. `isolate` crea un contexto de apilado propio:
 * sin eso, las capas de Leaflet (z-index 400+) quedan por encima de los diálogos y del menú.
 */
export function Mapa({ className, children, center = CENTRO_POR_DEFECTO, zoom = ZOOM_POR_DEFECTO }) {
  return (
    <div className={cn('isolate overflow-hidden rounded-md border border-border', className)}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="size-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <RecalcularTamano />
        {children}
      </MapContainer>
    </div>
  )
}

/** Encuadra el mapa para que entren todos los puntos. Se re-ejecuta cuando cambia `clave`. */
export function AjustarVista({ puntos, clave }) {
  const map = useMap()
  useEffect(() => {
    if (!puntos.length) return
    if (puntos.length === 1) {
      map.setView(puntos[0], 16)
    } else {
      map.fitBounds(puntos, { padding: [32, 32], maxZoom: 16 })
    }
    // Solo cuando cambia el conjunto de datos, no en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, clave])
  return null
}

/** Centra el mapa en un punto cuando cambia (ej. al usar "mi ubicación"). */
export function CentrarEn({ punto, zoom = 17 }) {
  const map = useMap()
  const lat = punto?.[0]
  const lng = punto?.[1]
  useEffect(() => {
    if (lat !== undefined && lng !== undefined) map.setView([lat, lng], zoom)
  }, [map, lat, lng, zoom])
  return null
}

/** Llama a onClick({ lat, lng }) al tocar el mapa. */
export function AlTocarMapa({ onClick }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

// Dentro de un diálogo o una pestaña el contenedor cambia de tamaño después de montarse
// (animación, tab oculto): sin esto Leaflet dibuja solo una parte de las baldosas.
function RecalcularTamano() {
  const map = useMap()
  useEffect(() => {
    const ids = [100, 300, 600].map((ms) => setTimeout(() => map.invalidateSize(), ms))
    const contenedor = map.getContainer()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => map.invalidateSize()) : null
    observer?.observe(contenedor)
    return () => {
      ids.forEach(clearTimeout)
      observer?.disconnect()
    }
  }, [map])
  return null
}