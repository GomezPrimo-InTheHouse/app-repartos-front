import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { fetchProductosPaginado } from '@/api/productos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProductoDetalleDialog } from '@/components/productos/ProductoDetalleDialog'
import { ProductoFormSheet } from '@/components/productos/ProductoFormSheet'
import { RecordCard } from '@/components/ui/record-card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const POR_PAGINA = 8

const FILTROS = [
  { value: 'activos', label: 'Activos', activo: true },
  { value: 'inactivos', label: 'Inactivos', activo: false },
  { value: 'todos', label: 'Todos', activo: undefined },
]

// El orden lo resuelve el backend (productos.service acepta nombre | precio_venta | stock_actual),
// así funciona bien con la paginación. Los de stock solo se ofrecen si la empresa usa Producción.
const ORDENES = [
  { value: 'nombre-asc', label: 'Nombre (A-Z)', ordenarPor: 'nombre', orden: 'asc' },
  { value: 'nombre-desc', label: 'Nombre (Z-A)', ordenarPor: 'nombre', orden: 'desc' },
  { value: 'precio-desc', label: 'Precio (mayor a menor)', ordenarPor: 'precio_venta', orden: 'desc' },
  { value: 'precio-asc', label: 'Precio (menor a mayor)', ordenarPor: 'precio_venta', orden: 'asc' },
  { value: 'stock-asc', label: 'Stock (menor a mayor)', ordenarPor: 'stock_actual', orden: 'asc', soloProduccion: true },
]

export function ProductosPage() {
  const { usaProduccion } = useAuth()
  const [busquedaInput, setBusquedaInput] = useState('')
  const [filtro, setFiltro] = useState('activos')
  const [orden, setOrden] = useState('nombre-asc')
  const [pagina, setPagina] = useState(0)
  const busqueda = useDebouncedValue(busquedaInput)
  const activo = FILTROS.find((f) => f.value === filtro)?.activo
  const ordenesDisponibles = ORDENES.filter((o) => !o.soloProduccion || usaProduccion)
  const ordenElegido = ordenesDisponibles.find((o) => o.value === orden) ?? ordenesDisponibles[0]

  // Si cambia la búsqueda (debounced), se vuelve a la primera página
  const [busquedaAnterior, setBusquedaAnterior] = useState(busqueda)
  if (busqueda !== busquedaAnterior) {
    setBusquedaAnterior(busqueda)
    setPagina(0)
  }

  const params = {
    busqueda: busqueda || undefined,
    activo,
    ordenarPor: ordenElegido.ordenarPor,
    orden: ordenElegido.orden,
    limit: POR_PAGINA,
    offset: pagina * POR_PAGINA,
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['productos', 'paginado', params],
    queryFn: () => fetchProductosPaginado(params),
  })

  const productos = data?.productos ?? []
  const total = data?.total ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  function actualizarFiltro(setter) {
    return (value) => {
      setter(value)
      setPagina(0)
    }
  }

  return (
    <>
      <PageHeader
        title="Productos"
        description="Catálogo de productos del negocio"
        actions={<ProductoFormSheet trigger={<Button>Nuevo producto</Button>} />}
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={busquedaInput} onChange={(e) => setBusquedaInput(e.target.value)}
              placeholder="Buscar por nombre…" className="pl-9" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-1 rounded-md border border-border p-1">
              {FILTROS.map((f) => (
                <Button key={f.value} type="button" size="sm" variant="ghost"
                  onClick={() => actualizarFiltro(setFiltro)(f.value)}
                  className={cn('flex-1', filtro === f.value && 'bg-secondary text-secondary-foreground')}>
                  {f.label}
                </Button>
              ))}
            </div>

            <Select value={ordenElegido.value} onValueChange={actualizarFiltro(setOrden)}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Ordenar por…" />
              </SelectTrigger>
              <SelectContent>
                {ordenesDisponibles.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>
        )}
        {isError && (
          <p className="py-8 text-center text-sm text-destructive">
            No se pudo cargar el catálogo de productos.
          </p>
        )}
        {!isLoading && !isError && productos.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {busqueda ? 'No hay productos que coincidan con la búsqueda.' : 'No hay productos cargados.'}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((producto) => {
            const stockBajo =
              usaProduccion && producto.stock_minimo > 0 && producto.stock_actual <= producto.stock_minimo
            return (
              <RecordCard
                key={producto.id}
                title={producto.nombre}
                badge={
                  <Badge variant={producto.activo ? 'success' : 'destructive'}>
                    {producto.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                }
                fields={[
                  { label: 'Precio de venta', value: formatCurrency(producto.precio_venta) },
                  { label: 'Costo unitario', value: formatCurrency(producto.costo_unitario) },
                  usaProduccion
                    ? {
                        label: 'Stock',
                        value: (
                          <span className={cn('font-mono-num', stockBajo && 'text-destructive')}>
                            {producto.stock_actual.toLocaleString('es-AR')}
                          </span>
                        ),
                      }
                    : { label: 'Categoría', value: producto.categoria },
                ]}
                actions={
                  <>
                    <ProductoDetalleDialog producto={producto}
                      trigger={<Button variant="outline" size="sm">Ver</Button>} />
                    <ProductoFormSheet producto={producto}
                      trigger={<Button variant="outline" size="sm">Editar</Button>} />
                  </>
                }
              />
            )
          })}
        </div>

        {total > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {productos.length} de {total}
            </p>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <Button type="button" variant="outline" size="sm" disabled={pagina === 0}
                onClick={() => setPagina((p) => p - 1)}>
                <ChevronLeft className="size-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {pagina + 1} de {totalPaginas}
              </span>
              <Button type="button" variant="outline" size="sm" disabled={pagina + 1 >= totalPaginas}
                onClick={() => setPagina((p) => p + 1)}>
                Siguiente
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}