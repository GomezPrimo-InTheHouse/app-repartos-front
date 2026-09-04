import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { fetchProductos } from '@/api/productos'
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
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const FILTROS = [
  { value: 'activos', label: 'Activos', activo: true },
  { value: 'inactivos', label: 'Inactivos', activo: false },
  { value: 'todos', label: 'Todos', activo: undefined },
]

// Orden "Stock (menor a mayor)" se saca por ahora: el sistema no controla
// stock en los despachos, así que ordenar por un número que nunca cambia
// no aporta nada (ver addendum "Eliminación del control de stock").
const ORDENES = [
  { value: 'nombre-asc', label: 'Nombre (A-Z)' },
  { value: 'nombre-desc', label: 'Nombre (Z-A)' },
  { value: 'precio-desc', label: 'Precio (mayor a menor)' },
  { value: 'precio-asc', label: 'Precio (menor a mayor)' },
]

function ordenarProductos(productos, orden) {
  if (!productos) return productos
  const copia = [...productos]
  switch (orden) {
    case 'nombre-desc':
      return copia.sort((a, b) => b.nombre.localeCompare(a.nombre))
    case 'precio-desc':
      return copia.sort((a, b) => b.precio_venta - a.precio_venta)
    case 'precio-asc':
      return copia.sort((a, b) => a.precio_venta - b.precio_venta)
    default:
      return copia.sort((a, b) => a.nombre.localeCompare(b.nombre))
  }
}

export function ProductosPage() {
  const [busquedaInput, setBusquedaInput] = useState('')
  const [filtro, setFiltro] = useState('activos')
  const [orden, setOrden] = useState('nombre-asc')
  const busqueda = useDebouncedValue(busquedaInput)
  const activo = FILTROS.find((f) => f.value === filtro)?.activo

  const { data: productos, isLoading, isError } = useQuery({
    queryKey: ['productos', { busqueda, activo }],
    queryFn: () => fetchProductos({ busqueda: busqueda || undefined, activo }),
  })

  const productosOrdenados = useMemo(() => ordenarProductos(productos, orden), [productos, orden])

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
                  onClick={() => setFiltro(f.value)}
                  className={cn('flex-1', filtro === f.value && 'bg-secondary text-secondary-foreground')}>
                  {f.label}
                </Button>
              ))}
            </div>

            <Select value={orden} onValueChange={setOrden}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Ordenar por…" />
              </SelectTrigger>
              <SelectContent>
                {ORDENES.map((o) => (
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
        {productosOrdenados?.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {busqueda ? 'No hay productos que coincidan con la búsqueda.' : 'No hay productos cargados.'}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productosOrdenados?.map((producto) => (
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
                { label: 'Categoría', value: producto.categoria },
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
          ))}
        </div>
      </div>
    </>
  )
}