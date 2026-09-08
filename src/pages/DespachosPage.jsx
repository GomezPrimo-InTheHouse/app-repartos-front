import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { fetchClientes } from '@/api/clientes'
import { fetchDespachos } from '@/api/despachos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DespachoDetalleDialog } from '@/components/despachos/DespachoDetalleDialog'
import { Input } from '@/components/ui/input'
import { NuevoDespachoDialog } from '@/components/despachos/NuevoDespachoDialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { RecordCard } from '@/components/ui/record-card'
import { RepartoDelDiaDialog } from '@/components/despachos/RepartoDelDiaDialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/format'

const ESTADOS = [
  { value: 'todos', label: 'Todos' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'anulado', label: 'Anulado' },
]

const POR_PAGINA = 8

export function DespachosPage() {
  const [clienteId, setClienteId] = useState('todos')
  const [estado, setEstado] = useState('todos')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(0)

  const { data: clientes } = useQuery({
    queryKey: ['clientes', { paraFiltro: true }],
    queryFn: () => fetchClientes({}),
  })

  const filtros = {
    clienteId: clienteId !== 'todos' ? clienteId : undefined,
    estado: estado !== 'todos' ? estado : undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
    limit: POR_PAGINA,
    offset: pagina * POR_PAGINA,
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['despachos', filtros],
    queryFn: () => fetchDespachos(filtros),
  })

  const despachos = data?.despachos ?? []
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
        title="Despachos"
        description="Registro de ventas a clientes"
        actions={
          <div className="flex gap-2">
            <RepartoDelDiaDialog
              trigger={
                <Button variant="outline">
                  <CalendarDays className="size-4" />
                  Reparto de hoy
                </Button>
              }
            />
            <NuevoDespachoDialog trigger={<Button>Nuevo despacho</Button>} />
          </div>
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Select value={clienteId} onValueChange={actualizarFiltro(setClienteId)}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los clientes</SelectItem>
              {clientes?.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={estado} onValueChange={actualizarFiltro(setEstado)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={desde}
            onChange={(e) => actualizarFiltro(setDesde)(e.target.value)}
            className="w-full sm:w-40"
          />
          <Input
            type="date"
            value={hasta}
            onChange={(e) => actualizarFiltro(setHasta)(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>

        {isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>
        )}
        {isError && (
          <p className="py-8 text-center text-sm text-destructive">
            No se pudo cargar el listado de despachos.
          </p>
        )}
        {!isLoading && despachos.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay despachos que coincidan con los filtros.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {despachos.map((despacho) => (
            <RecordCard
              key={despacho.id}
              title={`#${despacho.numero} — ${despacho.cliente_nombre}`}
              badge={
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={despacho.estado === 'entregado' ? 'success' : 'destructive'}>
                    {despacho.estado === 'entregado' ? 'Entregado' : 'Anulado'}
                  </Badge>
                  {despacho.alerta_credito_al_momento && <Badge variant="warning">Crédito</Badge>}
                </div>
              }
              fields={[
                { label: 'Fecha', value: formatDate(despacho.fecha) },
                { label: 'Total', value: formatCurrency(despacho.total) },
              ]}
              actions={
                <DespachoDetalleDialog
                  despachoId={despacho.id}
                  trigger={<Button variant="outline" size="sm">Ver</Button>}
                />
              }
            />
          ))}
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {despachos.length} de {total}
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