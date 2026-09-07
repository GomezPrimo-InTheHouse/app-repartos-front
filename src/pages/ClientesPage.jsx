import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { fetchClientesPaginado } from '@/api/clientes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClienteDetalleDialog } from '@/components/clientes/ClienteDetalleDialog'
import { ClienteFormSheet } from '@/components/clientes/ClienteFormSheet'
import { ImportarClientesDialog } from '@/components/clientes/ImportarClientesDialog'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/PageHeader'
import { RecordCard } from '@/components/ui/record-card'
import { SaldoValor } from '@/components/clientes/SaldoValor'
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

const ORDENES = [
  { value: 'nombre-asc', label: 'Nombre (A-Z)', ordenarPor: 'nombre', orden: 'asc' },
  { value: 'nombre-desc', label: 'Nombre (Z-A)', ordenarPor: 'nombre', orden: 'desc' },
  { value: 'saldo-desc', label: 'Deuda (mayor a menor)', ordenarPor: 'saldo', orden: 'desc' },
  { value: 'saldo-asc', label: 'Deuda (menor a mayor)', ordenarPor: 'saldo', orden: 'asc' },
]

const POR_PAGINA = 15

export function ClientesPage() {
  const [busquedaInput, setBusquedaInput] = useState('')
  const [filtro, setFiltro] = useState('activos')
  const [ordenValue, setOrdenValue] = useState('nombre-asc')
  const [soloDeudores, setSoloDeudores] = useState(false)
  const [pagina, setPagina] = useState(0)
  const busqueda = useDebouncedValue(busquedaInput)
  const activo = FILTROS.find((f) => f.value === filtro)?.activo
  const { ordenarPor, orden } = ORDENES.find((o) => o.value === ordenValue)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clientes', { busqueda, activo, ordenarPor, orden, soloDeudores, pagina }],
    queryFn: () =>
      fetchClientesPaginado({
        busqueda: busqueda || undefined,
        activo,
        ordenarPor,
        orden,
        soloDeudores: soloDeudores || undefined,
        limit: POR_PAGINA,
        offset: pagina * POR_PAGINA,
      }),
  })

  const clientes = data?.clientes ?? []
  const total = data?.total ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  // Cualquier cambio de filtro/búsqueda/orden vuelve a la página 1 — evita
  // quedar "colgado" en una página que ya no existe con el nuevo filtro.
  function actualizarFiltro(setter) {
    return (value) => {
      setter(value)
      setPagina(0)
    }
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Listado de clientes del negocio"
        actions={
          <div className="flex gap-2">
            <ImportarClientesDialog trigger={<Button variant="outline">Importar Excel</Button>} />
            <ClienteFormSheet trigger={<Button>Nuevo cliente</Button>} />
          </div>
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busquedaInput}
              onChange={(e) => {
                setBusquedaInput(e.target.value)
                setPagina(0)
              }}
              placeholder="Buscar por nombre…"
              className="pl-9"
            />
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

            <Button
              type="button"
              size="sm"
              variant={soloDeudores ? 'accent' : 'outline'}
              onClick={() => actualizarFiltro(setSoloDeudores)((prev) => !prev)}
            >
              Solo deudores
            </Button>

            <Select value={ordenValue} onValueChange={actualizarFiltro(setOrdenValue)}>
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
            No se pudo cargar el listado de clientes.
          </p>
        )}
        {!isLoading && clientes.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {soloDeudores
              ? 'No hay clientes con deuda pendiente.'
              : busqueda
                ? 'No hay clientes que coincidan con la búsqueda.'
                : 'No hay clientes cargados.'}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clientes.map((cliente) => (
            <RecordCard
              key={cliente.id}
              title={cliente.nombre}
              badge={
                <Badge variant={cliente.activo ? 'success' : 'destructive'}>
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              }
              fields={[
                { label: 'Saldo', value: <SaldoValor saldo={cliente.saldo} /> },
                { label: 'Teléfono', value: cliente.telefono },
                { label: 'Localidad', value: cliente.localidad },
                {
                  label: 'Límite',
                  value: cliente.limite_credito > 0 ? formatCurrency(cliente.limite_credito) : 'Sin límite',
                },
              ]}
              actions={
                <>
                  <ClienteDetalleDialog cliente={cliente}
                    trigger={<Button variant="outline" size="sm">Ver</Button>} />
                  <ClienteFormSheet cliente={cliente}
                    trigger={<Button variant="outline" size="sm">Editar</Button>} />
                </>
              }
            />
          ))}
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {clientes.length} de {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagina === 0}
                onClick={() => setPagina((p) => p - 1)}
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {pagina + 1} de {totalPaginas}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagina + 1 >= totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
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