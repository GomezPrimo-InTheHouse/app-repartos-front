import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, MapPin, Navigation } from 'lucide-react'
import { useRef, useState } from 'react'
import { Marker, Polyline, Popup } from 'react-leaflet'
import { fetchClientesGeo } from '@/api/geolocalizacion'
import { NuevoDespachoDialog } from '@/components/despachos/NuevoDespachoDialog'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/format'
import { linkComoLlegar } from '@/lib/geolocalizacion'
import { ETIQUETAS_DEUDA, colorDeuda, estadoDeuda, iconoCliente } from './iconos'
import { AjustarVista, Mapa } from './MapaBase'
import { UbicarClienteDialog } from './UbicarClienteDialog'

const TODOS = 'todos'
const SIN_UBICAR_POR_PAGINA = 25

const DIAS_CORTOS = { lunes: 'Lu', martes: 'Ma', miercoles: 'Mi', jueves: 'Ju', viernes: 'Vi', sabado: 'Sá', domingo: 'Do' }

function etiquetaLista(lista) {
  if (lista.tipo === 'semanal') {
    return `${lista.nombre} (${(lista.dias_semana ?? []).map((d) => DIAS_CORTOS[d] ?? d).join(', ')})`
  }
  return `${lista.nombre} (${lista.fecha ? new Date(lista.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : 'única'})`
}

export function MapaClientesTab() {
  const { tienePermiso } = useAuth()
  const [listaId, setListaId] = useState(TODOS)
  const [aUbicar, setAUbicar] = useState(null)
  const [aDespachar, setADespachar] = useState(null)
  const [paginaSinUbicar, setPaginaSinUbicar] = useState(0)
  const tituloSinUbicarRef = useRef(null)

  const conLista = listaId !== TODOS
  const { data, isLoading, isError } = useQuery({
    queryKey: ['geolocalizacion', 'clientes', listaId],
    queryFn: () => fetchClientesGeo({ listaId: conLista ? listaId : undefined }),
  })

  const listas = data?.listas ?? []
  const clientes = data?.clientes ?? []
  const ubicados = clientes.filter((c) => c.latitud !== null)
  const sinUbicar = clientes.filter((c) => c.latitud === null)
  const puntos = ubicados.map((c) => [c.latitud, c.longitud])
  // Número de visita: posición dentro de la lista completa (incluye a los sin ubicar, para que coincida con el reparto)
  const numeroDe = (c) => (conLista ? clientes.indexOf(c) + 1 : null)
  const puedeDespachar = tienePermiso('despachos')

  // Paginación local de "Clientes sin ubicar" (los datos ya vienen completos para el mapa).
  // Al ubicar a un cliente la lista se achica: si la página actual queda vacía, se muestra la última.
  const totalPaginasSinUbicar = Math.max(1, Math.ceil(sinUbicar.length / SIN_UBICAR_POR_PAGINA))
  const paginaActual = Math.min(paginaSinUbicar, totalPaginasSinUbicar - 1)
  const desde = paginaActual * SIN_UBICAR_POR_PAGINA
  const sinUbicarPagina = sinUbicar.slice(desde, desde + SIN_UBICAR_POR_PAGINA)

  function irAPaginaSinUbicar(nueva) {
    setPaginaSinUbicar(nueva)
    tituloSinUbicarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function cambiarLista(valor) {
    setListaId(valor)
    setPaginaSinUbicar(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={listaId} onValueChange={cambiarLista}>
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue placeholder="Elegí una lista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los clientes activos</SelectItem>
            {listas.map((l) => (
              <SelectItem key={l.id} value={String(l.id)}>{etiquetaLista(l)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {['alDia', 'conDeuda', 'excedido'].map((estado) => (
            <span key={estado} className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-full" style={{ background: colorDeuda(estado) }} />
              {ETIQUETAS_DEUDA[estado]}
            </span>
          ))}
        </div>
      </div>

      {isError && <p className="py-8 text-center text-sm text-destructive">No se pudo cargar el mapa de clientes.</p>}

      <Mapa className="h-[55vh] min-h-80">
        <AjustarVista puntos={puntos} clave={`${listaId}-${ubicados.length}`} />
        {conLista && puntos.length > 1 && (
          <Polyline positions={puntos} pathOptions={{ color: '#1C2B33', weight: 3, opacity: 0.6, dashArray: '6 8' }} />
        )}
        {ubicados.map((c) => {
          const estado = estadoDeuda(c)
          return (
            <Marker key={c.id} position={[c.latitud, c.longitud]} icon={iconoCliente(estado, numeroDe(c))}>
              <Popup>
                <div className="flex min-w-48 flex-col gap-1.5 font-sans">
                  <div className="font-display text-sm font-semibold">
                    {numeroDe(c) ? `${numeroDe(c)}. ` : ''}{c.nombre}
                  </div>
                  {c.direccion && <div className="text-xs text-muted-foreground">{c.direccion}</div>}
                  <div className="text-xs">
                    Saldo: <strong>{formatCurrency(c.saldo)}</strong> · {ETIQUETAS_DEUDA[estado]}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Button asChild size="sm" variant="outline">
                      <a href={linkComoLlegar(c.latitud, c.longitud)} target="_blank" rel="noreferrer" style={{ color: 'var(--foreground)' }}>
                        <Navigation className="size-3.5" />
                        Cómo llegar
                      </a>
                    </Button>
                    {puedeDespachar && (
                      <Button size="sm" onClick={() => setADespachar(c)}>Nuevo despacho</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setAUbicar(c)}>Mover pin</Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </Mapa>

      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {ubicados.length} ubicado{ubicados.length === 1 ? '' : 's'} · {sinUbicar.length} sin ubicar
          {conLista && clientes.length === 0 && ' · esta lista no tiene clientes'}
        </p>
      )}

      {sinUbicar.length > 0 && (
        <div className="flex flex-col gap-2">
          <p ref={tituloSinUbicarRef} className="scroll-mt-4 text-sm font-semibold">
            Clientes sin ubicar <span className="font-normal text-muted-foreground">({sinUbicar.length})</span>
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sinUbicarPagina.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {numeroDe(c) ? `${numeroDe(c)}. ` : ''}{c.nombre}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{c.direccion || 'Sin dirección cargada'}</p>
                </div>
                <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => setAUbicar(c)}>
                  <MapPin className="size-4" />
                  Ubicar
                </Button>
              </div>
            ))}
          </div>

          {sinUbicar.length > SIN_UBICAR_POR_PAGINA && (
            <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {desde + 1}–{desde + sinUbicarPagina.length} de {sinUbicar.length}
              </p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <Button type="button" variant="outline" size="sm" disabled={paginaActual === 0}
                  onClick={() => irAPaginaSinUbicar(paginaActual - 1)}>
                  <ChevronLeft className="size-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {paginaActual + 1} de {totalPaginasSinUbicar}
                </span>
                <Button type="button" variant="outline" size="sm" disabled={paginaActual + 1 >= totalPaginasSinUbicar}
                  onClick={() => irAPaginaSinUbicar(paginaActual + 1)}>
                  Siguiente
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <UbicarClienteDialog
        cliente={aUbicar}
        open={Boolean(aUbicar)}
        onOpenChange={(abierto) => { if (!abierto) setAUbicar(null) }}
      />

      {aDespachar && (
        <NuevoDespachoDialog
          open
          onOpenChange={(abierto) => { if (!abierto) setADespachar(null) }}
          clienteIdInicial={aDespachar.id}
          clienteNombreInicial={aDespachar.nombre}
          clienteAumentoInicial={aDespachar.porcentaje_aumento}
        />
      )}
    </div>
  )
}