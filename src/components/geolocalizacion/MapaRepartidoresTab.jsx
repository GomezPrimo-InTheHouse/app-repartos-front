import { useQuery } from '@tanstack/react-query'
import { Navigation, RefreshCw } from 'lucide-react'
import { Marker, Popup } from 'react-leaflet'
import { fetchRepartidoresGeo } from '@/api/geolocalizacion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HORAS_UBICACION_VIGENTE, haceCuanto, linkComoLlegar, ubicacionVigente } from '@/lib/geolocalizacion'
import { cn } from '@/lib/utils'
import { iconoRepartidor } from './iconos'
import { AjustarVista, Mapa } from './MapaBase'

const ETIQUETA_ROL = { admin: 'Administrador', vendedor: 'Repartidor' }

/**
 * Última posición conocida de cada empleado. No es seguimiento en vivo: la posición se actualiza
 * cuando el empleado abre la app o vuelve a ella (como mucho cada 2 minutos).
 */
export function MapaRepartidoresTab() {
  const { data: repartidores = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['geolocalizacion', 'repartidores'],
    queryFn: fetchRepartidoresGeo,
    refetchInterval: 60_000,
  })

  const conUbicacion = repartidores.filter((r) => r.latitud !== null)
  const puntos = conUbicacion.map((r) => [r.latitud, r.longitud])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Se actualiza cuando cada empleado abre la app. En gris, posiciones de hace más de {HORAS_UBICACION_VIGENTE} h.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {isError && <p className="py-8 text-center text-sm text-destructive">No se pudieron cargar las ubicaciones.</p>}

      <Mapa className="h-[55vh] min-h-80">
        <AjustarVista puntos={puntos} clave={conUbicacion.map((r) => r.id).join(',')} />
        {conUbicacion.map((r) => (
          <Marker key={r.id} position={[r.latitud, r.longitud]} icon={iconoRepartidor(r.nombre_completo, ubicacionVigente(r.registrada_at))}>
            <Popup>
              <div className="flex min-w-44 flex-col gap-1 font-sans">
                <div className="font-display text-sm font-semibold">{r.nombre_completo}</div>
                <div className="text-xs text-muted-foreground">
                  {haceCuanto(r.registrada_at)}
                  {r.precision_m ? ` · ±${Math.round(r.precision_m)} m` : ''}
                </div>
                <Button asChild size="sm" variant="outline" className="mt-1">
                  <a href={linkComoLlegar(r.latitud, r.longitud)} target="_blank" rel="noreferrer" style={{ color: 'var(--foreground)' }}>
                    <Navigation className="size-3.5" />
                    Cómo llegar
                  </a>
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </Mapa>

      {isLoading && <p className="text-center text-sm text-muted-foreground">Cargando…</p>}

      {!isLoading && repartidores.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {repartidores.map((r) => {
            const vigente = ubicacionVigente(r.registrada_at)
            return (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.nombre_completo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ETIQUETA_ROL[r.rol] ?? r.rol} · {r.registrada_at ? haceCuanto(r.registrada_at) : 'todavía no abrió la app'}
                  </p>
                </div>
                <Badge variant={!r.registrada_at ? 'outline' : vigente ? 'success' : 'default'} className="shrink-0">
                  {!r.registrada_at ? 'Sin datos' : vigente ? 'Reciente' : 'Desactualizada'}
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}