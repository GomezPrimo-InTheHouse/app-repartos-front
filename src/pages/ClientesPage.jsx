import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { fetchClientes } from '@/api/clientes'
import { SaldoValor } from '@/components/clientes/SaldoValor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClienteDetalleDialog } from '@/components/clientes/ClienteDetalleDialog'
import { ClienteFormSheet } from '@/components/clientes/ClienteFormSheet'
import { ImportarClientesDialog } from '@/components/clientes/ImportarClientesDialog'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/PageHeader'
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

const ORDENES = [
  { value: 'nombre-asc', label: 'Nombre (A-Z)', ordenarPor: 'nombre', orden: 'asc' },
  { value: 'nombre-desc', label: 'Nombre (Z-A)', ordenarPor: 'nombre', orden: 'desc' },
  { value: 'saldo-desc', label: 'Deuda (mayor a menor)', ordenarPor: 'saldo', orden: 'desc' },
  { value: 'saldo-asc', label: 'Deuda (menor a mayor)', ordenarPor: 'saldo', orden: 'asc' },
]

// function SaldoValor({ saldo }) {
//   if (saldo > 0) {
//     return <span className="font-mono-num font-semibold text-destructive">{formatCurrency(saldo)}</span>
//   }
//   if (saldo < 0) {
//     return (
//       <span className="font-mono-num font-semibold text-success">
//         A favor {formatCurrency(Math.abs(saldo))}
//       </span>
//     )
//   }
//   return <span className="font-mono-num font-semibold text-success">Al día</span>
// }

export function ClientesPage() {
  const [busquedaInput, setBusquedaInput] = useState('')
  const [filtro, setFiltro] = useState('activos')
  const [ordenValue, setOrdenValue] = useState('nombre-asc')
  const [soloDeudores, setSoloDeudores] = useState(false)
  const busqueda = useDebouncedValue(busquedaInput)
  const activo = FILTROS.find((f) => f.value === filtro)?.activo
  const { ordenarPor, orden } = ORDENES.find((o) => o.value === ordenValue)

  const { data: clientes, isLoading, isError } = useQuery({
    queryKey: ['clientes', { busqueda, activo, ordenarPor, orden, soloDeudores }],
    queryFn: () =>
      fetchClientes({
        busqueda: busqueda || undefined,
        activo,
        ordenarPor,
        orden,
        soloDeudores: soloDeudores || undefined,
      }),
  })

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

            <Button
              type="button"
              size="sm"
              variant={soloDeudores ? 'accent' : 'outline'}
              onClick={() => setSoloDeudores((prev) => !prev)}
            >
              Solo deudores
            </Button>

            <Select value={ordenValue} onValueChange={setOrdenValue}>
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
        {clientes?.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {soloDeudores
              ? 'No hay clientes con deuda pendiente.'
              : busqueda
                ? 'No hay clientes que coincidan con la búsqueda.'
                : 'No hay clientes cargados.'}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientes?.map((cliente) => (
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
                { label: 'Días de crédito', value: cliente.dias_credito },
                {
                  label: 'Límite de crédito',
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
      </div>
    </>
  )
}