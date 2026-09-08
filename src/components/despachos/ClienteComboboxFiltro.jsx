import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Selector de cliente con buscador — pensado como reemplazo del <Select>
 * de "Cliente" en DespachosPage/PagosPage cuando la lista de clientes es
 * larga y desplazarse por un dropdown simple es incómodo.
 *
 * Autocontenido a propósito (sin Popover/Command de shadcn, que no
 * estaban confirmados como disponibles en el proyecto): un <Input> que
 * al enfocarse muestra una lista filtrada en un div posicionado debajo,
 * con navegación por teclado (↑/↓/Enter/Escape) y cierre al clickear
 * afuera.
 *
 * Props:
 * - clientes: array de { id, nombre } — la lista completa a filtrar.
 * - value: id del cliente seleccionado, o 'todos' para "sin filtro".
 * - onChange: (id) => void
 * - placeholder: texto del input cuando no hay selección.
 */
export function ClienteComboboxFiltro({ clientes = [], value, onChange, placeholder = 'Todos los clientes' }) {
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [indiceActivo, setIndiceActivo] = useState(0)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const clienteSeleccionado = clientes.find((c) => c.id === value)

  const opciones = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    const lista = term
      ? clientes.filter((c) => c.nombre.toLowerCase().includes(term))
      : clientes
    return lista
  }, [clientes, busqueda])

  // Cierra el dropdown al clickear afuera del componente.
  useEffect(() => {
    if (!open) return
    function handleClickAfuera(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickAfuera)
    return () => document.removeEventListener('mousedown', handleClickAfuera)
  }, [open])

  function handleAbrir() {
    setOpen(true)
    setBusqueda('')
    setIndiceActivo(0)
  }

  function handleSeleccionar(id) {
    onChange(id)
    setOpen(false)
    setBusqueda('')
    inputRef.current?.blur()
  }

  function handleLimpiar(event) {
    event.stopPropagation()
    onChange('todos')
    setBusqueda('')
  }

  function handleKeyDown(event) {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault()
        handleAbrir()
      }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIndiceActivo((i) => Math.min(i + 1, opciones.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIndiceActivo((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const opcion = opciones[indiceActivo]
      if (opcion) handleSeleccionar(opcion.id)
    } else if (event.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative w-full sm:w-56">
      <div className="relative">
        <Input
          ref={inputRef}
          value={open ? busqueda : clienteSeleccionado?.nombre ?? ''}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setIndiceActivo(0)
          }}
          onFocus={handleAbrir}
          onKeyDown={handleKeyDown}
          placeholder={clienteSeleccionado ? undefined : placeholder}
          className="pr-14"
          role="combobox"
          aria-expanded={open}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {clienteSeleccionado && !open && (
            <button
              type="button"
              onClick={handleLimpiar}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Quitar filtro de cliente"
            >
              <X className="size-3.5" />
            </button>
          )}
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          <button
            type="button"
            onClick={() => handleSeleccionar('todos')}
            className={cn(
              'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent',
              value === 'todos' && 'font-medium'
            )}
          >
            Todos los clientes
            {value === 'todos' && <Check className="size-4" />}
          </button>

          {opciones.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados.</p>
          )}

          {opciones.map((cliente, index) => (
            <button
              key={cliente.id}
              type="button"
              onClick={() => handleSeleccionar(cliente.id)}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent',
                index === indiceActivo && 'bg-accent',
                value === cliente.id && 'font-medium'
              )}
            >
              {cliente.nombre}
              {value === cliente.id && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}