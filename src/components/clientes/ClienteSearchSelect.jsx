import { useQuery } from '@tanstack/react-query'
import { Check, Search, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { fetchClientesPaginado } from '@/api/clientes'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'

const LIMITE_RESULTADOS = 20

/**
 * Selector de cliente con búsqueda real contra el backend (por nombre o
 * dirección), en vez de precargar todos los clientes de una sola vez —
 * necesario con 1000+ clientes, donde un <Select> tradicional listando
 * todo sería lento e inutilizable.
 *
 * Antes de seleccionar: muestra un input de búsqueda + lista de
 * coincidencias (máximo 20, debounced).
 * Después de seleccionar: muestra el cliente elegido como "pill" con
 * botón para cambiar la selección.
 */
export function ClienteSearchSelect({ value, onChange, clienteSeleccionado, placeholder = 'Buscar cliente por nombre o dirección…' }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const busqueda = useDebouncedValue(query, 300)
  const contenedorRef = useRef(null)

  const { data, isFetching } = useQuery({
    queryKey: ['clientes', 'buscador', busqueda],
    queryFn: () =>
      fetchClientesPaginado({ busqueda, activo: true, limit: LIMITE_RESULTADOS, offset: 0 }),
    enabled: open && busqueda.trim().length >= 2,
  })

  const resultados = data?.clientes ?? []

  function handleSeleccionar(cliente) {
    onChange(cliente.id, cliente)
    setQuery('')
    setOpen(false)
  }

  function handleLimpiar() {
    onChange('', null)
    setQuery('')
  }

  // Cierra la lista al perder foco del contenedor (click afuera), con un
  // pequeño delay para que el click sobre un resultado llegue a dispararse
  // antes de que el blur cierre la lista.
  function handleBlur(event) {
    if (contenedorRef.current?.contains(event.relatedTarget)) return
    setTimeout(() => setOpen(false), 100)
  }

  if (value && clienteSeleccionado) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{clienteSeleccionado.nombre}</span>
          {clienteSeleccionado.direccion && (
            <span className="text-xs text-muted-foreground">{clienteSeleccionado.direccion}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleLimpiar}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Cambiar cliente"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={contenedorRef} className="relative" onBlur={handleBlur}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-md">
          {isFetching && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Buscando…</p>
          )}
          {!isFetching && resultados.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados.</p>
          )}
          {!isFetching && resultados.length > 0 && (
            <ul className="max-h-64 overflow-y-auto py-1">
              {resultados.map((cliente) => (
                <li key={cliente.id}>
                  <button
                    type="button"
                    onClick={() => handleSeleccionar(cliente)}
                    className={cn(
                      'flex w-full flex-col items-start gap-0 px-3 py-2 text-left text-sm hover:bg-muted',
                    )}
                  >
                    <span className="font-medium">{cliente.nombre}</span>
                    {cliente.direccion && (
                      <span className="text-xs text-muted-foreground">{cliente.direccion}</span>
                    )}
                  </button>
                </li>
              ))}
              {resultados.length === LIMITE_RESULTADOS && (
                <li className="px-3 py-1.5 text-xs text-muted-foreground">
                  Mostrando los primeros {LIMITE_RESULTADOS} — afiná la búsqueda para más precisión.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}