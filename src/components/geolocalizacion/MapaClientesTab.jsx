// import { useQuery } from '@tanstack/react-query'
// import { ChevronLeft, ChevronRight, MapPin, Navigation } from 'lucide-react'
// import { useRef, useState } from 'react'
// import { Marker, Polyline, Popup } from 'react-leaflet'
// import { fetchClientesGeo } from '@/api/geolocalizacion'
// import { NuevoDespachoDialog } from '@/components/despachos/NuevoDespachoDialog'
// import { Button } from '@/components/ui/button'
// import {
//   Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
// } from '@/components/ui/select'
// import { useAuth } from '@/hooks/useAuth'
// import { formatCurrency } from '@/lib/format'
// import { linkComoLlegar } from '@/lib/geolocalizacion'
// import { ETIQUETAS_DEUDA, colorDeuda, estadoDeuda, iconoCliente } from './iconos'
// import { AjustarVista, Mapa } from './MapaBase'
// import { UbicarClienteDialog } from './UbicarClienteDialog'

// const TODOS = 'todos'
// const SIN_UBICAR_POR_PAGINA = 25

// const DIAS_CORTOS = { lunes: 'Lu', martes: 'Ma', miercoles: 'Mi', jueves: 'Ju', viernes: 'Vi', sabado: 'Sá', domingo: 'Do' }

// function etiquetaLista(lista) {
//   if (lista.tipo === 'semanal') {
//     return `${lista.nombre} (${(lista.dias_semana ?? []).map((d) => DIAS_CORTOS[d] ?? d).join(', ')})`
//   }
//   return `${lista.nombre} (${lista.fecha ? new Date(lista.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : 'única'})`
// }

// export function MapaClientesTab() {
//   const { tienePermiso } = useAuth()
//   const [listaId, setListaId] = useState(TODOS)
//   const [aUbicar, setAUbicar] = useState(null)
//   const [aDespachar, setADespachar] = useState(null)
//   const [paginaSinUbicar, setPaginaSinUbicar] = useState(0)
//   const tituloSinUbicarRef = useRef(null)

//   const conLista = listaId !== TODOS
//   const { data, isLoading, isError } = useQuery({
//     queryKey: ['geolocalizacion', 'clientes', listaId],
//     queryFn: () => fetchClientesGeo({ listaId: conLista ? listaId : undefined }),
//   })

//   const listas = data?.listas ?? []
//   const clientes = data?.clientes ?? []
//   const ubicados = clientes.filter((c) => c.latitud !== null)
//   const sinUbicar = clientes.filter((c) => c.latitud === null)
//   const puntos = ubicados.map((c) => [c.latitud, c.longitud])
//   // Número de visita: posición dentro de la lista completa (incluye a los sin ubicar, para que coincida con el reparto)
//   const numeroDe = (c) => (conLista ? clientes.indexOf(c) + 1 : null)
//   const puedeDespachar = tienePermiso('despachos')

//   // Paginación local de "Clientes sin ubicar" (los datos ya vienen completos para el mapa).
//   // Al ubicar a un cliente la lista se achica: si la página actual queda vacía, se muestra la última.
//   const totalPaginasSinUbicar = Math.max(1, Math.ceil(sinUbicar.length / SIN_UBICAR_POR_PAGINA))
//   const paginaActual = Math.min(paginaSinUbicar, totalPaginasSinUbicar - 1)
//   const desde = paginaActual * SIN_UBICAR_POR_PAGINA
//   const sinUbicarPagina = sinUbicar.slice(desde, desde + SIN_UBICAR_POR_PAGINA)

//   function irAPaginaSinUbicar(nueva) {
//     setPaginaSinUbicar(nueva)
//     tituloSinUbicarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
//   }

//   function cambiarLista(valor) {
//     setListaId(valor)
//     setPaginaSinUbicar(0)
//   }

//   return (
//     <div className="flex flex-col gap-4">
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <Select value={listaId} onValueChange={cambiarLista}>
//           <SelectTrigger className="w-full sm:w-80">
//             <SelectValue placeholder="Elegí una lista" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value={TODOS}>Todos los clientes activos</SelectItem>
//             {listas.map((l) => (
//               <SelectItem key={l.id} value={String(l.id)}>{etiquetaLista(l)}</SelectItem>
//             ))}
//           </SelectContent>
//         </Select>

//         <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
//           {['alDia', 'conDeuda', 'excedido'].map((estado) => (
//             <span key={estado} className="flex items-center gap-1.5">
//               <span className="inline-block size-3 rounded-full" style={{ background: colorDeuda(estado) }} />
//               {ETIQUETAS_DEUDA[estado]}
//             </span>
//           ))}
//         </div>
//       </div>

//       {isError && <p className="py-8 text-center text-sm text-destructive">No se pudo cargar el mapa de clientes.</p>}

//       <Mapa className="h-[55vh] min-h-80">
//         <AjustarVista puntos={puntos} clave={`${listaId}-${ubicados.length}`} />
//         {conLista && puntos.length > 1 && (
//           <Polyline positions={puntos} pathOptions={{ color: '#1C2B33', weight: 3, opacity: 0.6, dashArray: '6 8' }} />
//         )}
//         {ubicados.map((c) => {
//           const estado = estadoDeuda(c)
//           return (
//             <Marker key={c.id} position={[c.latitud, c.longitud]} icon={iconoCliente(estado, numeroDe(c))}>
//               <Popup>
//                 <div className="flex min-w-48 flex-col gap-1.5 font-sans">
//                   <div className="font-display text-sm font-semibold">
//                     {numeroDe(c) ? `${numeroDe(c)}. ` : ''}{c.nombre}
//                   </div>
//                   {c.direccion && <div className="text-xs text-muted-foreground">{c.direccion}</div>}
//                   <div className="text-xs">
//                     Saldo: <strong>{formatCurrency(c.saldo)}</strong> · {ETIQUETAS_DEUDA[estado]}
//                   </div>
//                   <div className="mt-1 flex flex-wrap gap-1.5">
//                     <Button asChild size="sm" variant="outline">
//                       <a href={linkComoLlegar(c.latitud, c.longitud)} target="_blank" rel="noreferrer" style={{ color: 'var(--foreground)' }}>
//                         <Navigation className="size-3.5" />
//                         Cómo llegar
//                       </a>
//                     </Button>
//                     {puedeDespachar && (
//                       <Button size="sm" onClick={() => setADespachar(c)}>Nuevo despacho</Button>
//                     )}
//                     <Button size="sm" variant="ghost" onClick={() => setAUbicar(c)}>Mover pin</Button>
//                   </div>
//                 </div>
//               </Popup>
//             </Marker>
//           )
//         })}
//       </Mapa>

//       {isLoading ? (
//         <p className="text-center text-sm text-muted-foreground">Cargando…</p>
//       ) : (
//         <p className="text-sm text-muted-foreground">
//           {ubicados.length} ubicado{ubicados.length === 1 ? '' : 's'} · {sinUbicar.length} sin ubicar
//           {conLista && clientes.length === 0 && ' · esta lista no tiene clientes'}
//         </p>
//       )}

//       {sinUbicar.length > 0 && (
//         <div className="flex flex-col gap-2">
//           <p ref={tituloSinUbicarRef} className="scroll-mt-4 text-sm font-semibold">
//             Clientes sin ubicar <span className="font-normal text-muted-foreground">({sinUbicar.length})</span>
//           </p>
//           <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
//             {sinUbicarPagina.map((c) => (
//               <div key={c.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-3">
//                 <div className="min-w-0">
//                   <p className="truncate text-sm font-medium">
//                     {numeroDe(c) ? `${numeroDe(c)}. ` : ''}{c.nombre}
//                   </p>
//                   <p className="truncate text-xs text-muted-foreground">{c.direccion || 'Sin dirección cargada'}</p>
//                 </div>
//                 <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => setAUbicar(c)}>
//                   <MapPin className="size-4" />
//                   Ubicar
//                 </Button>
//               </div>
//             ))}
//           </div>

//           {sinUbicar.length > SIN_UBICAR_POR_PAGINA && (
//             <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
//               <p className="text-sm text-muted-foreground">
//                 Mostrando {desde + 1}–{desde + sinUbicarPagina.length} de {sinUbicar.length}
//               </p>
//               <div className="flex items-center justify-between gap-2 sm:justify-end">
//                 <Button type="button" variant="outline" size="sm" disabled={paginaActual === 0}
//                   onClick={() => irAPaginaSinUbicar(paginaActual - 1)}>
//                   <ChevronLeft className="size-4" />
//                   Anterior
//                 </Button>
//                 <span className="text-sm text-muted-foreground">
//                   Página {paginaActual + 1} de {totalPaginasSinUbicar}
//                 </span>
//                 <Button type="button" variant="outline" size="sm" disabled={paginaActual + 1 >= totalPaginasSinUbicar}
//                   onClick={() => irAPaginaSinUbicar(paginaActual + 1)}>
//                   Siguiente
//                   <ChevronRight className="size-4" />
//                 </Button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       <UbicarClienteDialog
//         cliente={aUbicar}
//         open={Boolean(aUbicar)}
//         onOpenChange={(abierto) => { if (!abierto) setAUbicar(null) }}
//       />

//       {aDespachar && (
//         <NuevoDespachoDialog
//           open
//           onOpenChange={(abierto) => { if (!abierto) setADespachar(null) }}
//           clienteIdInicial={aDespachar.id}
//           clienteNombreInicial={aDespachar.nombre}
//           clienteAumentoInicial={aDespachar.porcentaje_aumento}
//         />
//       )}
//     </div>
//   )
// }

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Crosshair, MapPin, Navigation, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Marker, Polyline, Popup, useMap } from 'react-leaflet'
import { fetchClientesGeo } from '@/api/geolocalizacion'
import { NuevoDespachoDialog } from '@/components/despachos/NuevoDespachoDialog'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/format'
import { linkComoLlegar } from '@/lib/geolocalizacion'
import { avisarResultadoUbicacion, ubicarEnLote } from '@/lib/ubicacionAutomatica'
import { ETIQUETAS_DEUDA, colorDeuda, estadoDeuda, iconoCliente } from './iconos'
import { AjustarVista, Mapa } from './MapaBase'
import { UbicarClienteDialog } from './UbicarClienteDialog'

const TODOS = 'todos'
const POR_PAGINA = 25

const DIAS_CORTOS = { lunes: 'Lu', martes: 'Ma', miercoles: 'Mi', jueves: 'Ju', viernes: 'Vi', sabado: 'Sá', domingo: 'Do' }

function etiquetaLista(lista) {
  if (lista.tipo === 'semanal') {
    return `${lista.nombre} (${(lista.dias_semana ?? []).map((d) => DIAS_CORTOS[d] ?? d).join(', ')})`
  }
  return `${lista.nombre} (${lista.fecha ? new Date(lista.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : 'única'})`
}

const estaUbicado = (c) => c.latitud !== null && c.latitud !== undefined

/** Le pasa al componente padre la instancia de Leaflet, para poder centrar el mapa desde afuera. */
function ObtenerMapa({ mapaRef }) {
  const map = useMap()
  useEffect(() => {
    mapaRef.current = map
  }, [map, mapaRef])
  return null
}

export function MapaClientesTab() {
  const { tienePermiso } = useAuth()
  const queryClient = useQueryClient()
  const [listaId, setListaId] = useState(TODOS)
  const [aUbicar, setAUbicar] = useState(null)
  const [aDespachar, setADespachar] = useState(null)
  const [pagina, setPagina] = useState(0)
  // Ubicación automática en curso: { hechos, total } o null
  const [progresoAuto, setProgresoAuto] = useState(null)
  // Clientes ya intentados en esta visita: no se vuelven a ofrecer (daría el mismo resultado)
  const [intentados, setIntentados] = useState(() => new Set())
  const cancelarAutoRef = useRef(false)
  const tituloListadoRef = useRef(null)
  const mapaContenedorRef = useRef(null)
  const mapaRef = useRef(null)
  const marcadoresRef = useRef({})

  const conLista = listaId !== TODOS
  const { data, isLoading, isError } = useQuery({
    queryKey: ['geolocalizacion', 'clientes', listaId],
    queryFn: () => fetchClientesGeo({ listaId: conLista ? listaId : undefined }),
  })

  const listas = data?.listas ?? []
  const clientes = data?.clientes ?? []
  const ubicados = clientes.filter(estaUbicado)
  const sinUbicar = clientes.filter((c) => !estaUbicado(c))
  const puntos = ubicados.map((c) => [c.latitud, c.longitud])
  // Número de visita: posición dentro de la lista completa (incluye a los sin ubicar, para que coincida con el reparto)
  const numeroDe = (c) => (conLista ? clientes.indexOf(c) + 1 : null)
  const puedeDespachar = tienePermiso('despachos')

  // Con una lista elegida se muestran TODOS sus clientes (ubicados y no), en orden de visita.
  // Con "Todos los clientes" se muestran solo los que faltan ubicar.
  const listado = conLista ? clientes : sinUbicar
  const totalPaginas = Math.max(1, Math.ceil(listado.length / POR_PAGINA))
  // Al ubicar a un cliente la lista de "sin ubicar" se achica: si la página queda vacía, se muestra la última
  const paginaActual = Math.min(pagina, totalPaginas - 1)
  const desde = paginaActual * POR_PAGINA
  const listadoPagina = listado.slice(desde, desde + POR_PAGINA)

  // Candidatos a ubicación automática: sin ubicar, con dirección cargada y sin intentar todavía
  const candidatosAuto = sinUbicar.filter((c) => (c.direccion ?? '').trim().length >= 3 && !intentados.has(c.id))

  function irAPagina(nueva) {
    setPagina(nueva)
    tituloListadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function cambiarLista(valor) {
    setListaId(valor)
    setPagina(0)
  }

  function verEnMapa(cliente) {
    mapaContenedorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    mapaRef.current?.setView([cliente.latitud, cliente.longitud], 17)
    // Se abre el globo del cliente cuando terminó de moverse el mapa
    setTimeout(() => marcadoresRef.current[cliente.id]?.openPopup(), 350)
  }

  async function ubicarAutomaticamente() {
    cancelarAutoRef.current = false
    const lote = candidatosAuto
    const total = lote.length
    let procesados = 0
    setProgresoAuto({ hechos: 0, total })
    const resumen = await ubicarEnLote(
      lote.map((c) => ({ id: c.id, nombre: c.nombre })),
      {
        onProgreso: (hechos) => {
          procesados = hechos
          setProgresoAuto({ hechos, total })
          // Cada 5 clientes se refresca el mapa, para ir viendo aparecer los pines
          if (hechos % 5 === 0) queryClient.invalidateQueries({ queryKey: ['geolocalizacion', 'clientes'] })
        },
        debeCancelar: () => cancelarAutoRef.current,
      }
    )
    setProgresoAuto(null)
    // Si se canceló, los que no llegaron a buscarse se siguen ofreciendo
    setIntentados((prev) => new Set([...prev, ...lote.slice(0, procesados).map((c) => c.id)]))
    queryClient.invalidateQueries({ queryKey: ['geolocalizacion', 'clientes'] })
    queryClient.invalidateQueries({ queryKey: ['repartos', 'hoy'] })
    avisarResultadoUbicacion(resumen)
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

      <div ref={mapaContenedorRef} className="scroll-mt-4">
        <Mapa className="h-[55vh] min-h-80">
          <ObtenerMapa mapaRef={mapaRef} />
          <AjustarVista puntos={puntos} clave={`${listaId}-${ubicados.length}`} />
          {conLista && puntos.length > 1 && (
            <Polyline positions={puntos} pathOptions={{ color: '#1C2B33', weight: 3, opacity: 0.6, dashArray: '6 8' }} />
          )}
          {ubicados.map((c) => {
            const estado = estadoDeuda(c)
            return (
              <Marker
                key={c.id}
                position={[c.latitud, c.longitud]}
                icon={iconoCliente(estado, numeroDe(c))}
                ref={(marcador) => {
                  if (marcador) marcadoresRef.current[c.id] = marcador
                  else delete marcadoresRef.current[c.id]
                }}
              >
                <Popup>
                  <div className="flex min-w-48 flex-col gap-1.5 font-sans">
                    <div className="font-display text-sm font-semibold">
                      {numeroDe(c) ? `${numeroDe(c)}. ` : ''}{c.nombre}
                    </div>
                    {c.direccion && <div className="text-xs text-muted-foreground">{c.direccion}</div>}
                    <div className="text-xs">
                      Saldo: <strong>{formatCurrency(c.saldo)}</strong> · {ETIQUETAS_DEUDA[estado]}
                    </div>
                    {c.ubicacion_origen === 'auto' && (
                      <div className="text-xs text-muted-foreground">
                        Ubicado automáticamente por su dirección: revisá que el pin esté en la casa.
                      </div>
                    )}
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
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {ubicados.length} ubicado{ubicados.length === 1 ? '' : 's'} · {sinUbicar.length} sin ubicar
          {conLista && clientes.length === 0 && ' · esta lista no tiene clientes'}
        </p>
      )}

      {(candidatosAuto.length > 0 || progresoAuto) && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          {progresoAuto ? (
            <>
              <p className="text-sm">
                Buscando direcciones… <strong>{progresoAuto.hechos} de {progresoAuto.total}</strong>
                <span className="block text-xs text-muted-foreground">
                  Tarda cerca de 1 segundo por cliente. Podés seguir usando el mapa.
                </span>
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={() => { cancelarAutoRef.current = true }}>
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm">
                {candidatosAuto.length} cliente{candidatosAuto.length === 1 ? '' : 's'} sin ubicar
                {candidatosAuto.length === 1 ? ' tiene' : ' tienen'} dirección cargada.
                <span className="block text-xs text-muted-foreground">
                  El sistema puede buscarlas y poner los pines solo. Los que no encuentre te los avisa.
                </span>
              </p>
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={ubicarAutomaticamente}>
                <Sparkles className="size-4" />
                Ubicar automáticamente
              </Button>
            </>
          )}
        </div>
      )}

      {listado.length > 0 && (
        <div className="flex flex-col gap-2">
          <p ref={tituloListadoRef} className="scroll-mt-4 text-sm font-semibold">
            {conLista ? 'Clientes de esta lista' : 'Clientes sin ubicar'}{' '}
            <span className="font-normal text-muted-foreground">({listado.length})</span>
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {listadoPagina.map((c) => {
              const ubicado = estaUbicado(c)
              return (
                <div key={c.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {numeroDe(c) ? `${numeroDe(c)}. ` : ''}{c.nombre}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{c.direccion || 'Sin dirección cargada'}</p>
                    {conLista && (
                      <p className={`text-xs ${ubicado ? 'text-success' : 'text-warning'}`}>
                        {ubicado ? 'En el mapa' : 'Sin ubicar'}
                      </p>
                    )}
                  </div>
                  {ubicado ? (
                    <Button type="button" size="sm" variant="ghost" className="shrink-0" onClick={() => verEnMapa(c)}>
                      <Crosshair className="size-4" />
                      Ver
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => setAUbicar(c)}>
                      <MapPin className="size-4" />
                      Ubicar
                    </Button>
                  )}
                </div>
              )
            })}
          </div>

          {listado.length > POR_PAGINA && (
            <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {desde + 1}–{desde + listadoPagina.length} de {listado.length}
              </p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <Button type="button" variant="outline" size="sm" disabled={paginaActual === 0}
                  onClick={() => irAPagina(paginaActual - 1)}>
                  <ChevronLeft className="size-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {paginaActual + 1} de {totalPaginas}
                </span>
                <Button type="button" variant="outline" size="sm" disabled={paginaActual + 1 >= totalPaginas}
                  onClick={() => irAPagina(paginaActual + 1)}>
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