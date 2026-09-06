import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { fetchClientes } from '@/api/clientes'
import { getApiErrorMessage } from '@/api/client'
import { fetchPagos } from '@/api/pagos'
import { descargarComprobantePago } from '@/api/reportes'
import { useMutation } from '@tanstack/react-query'
import { AnularPagoDialog } from '@/components/pagos/AnularPagoDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NuevoPagoDialog } from '@/components/pagos/NuevoPagoDialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { RecordCard } from '@/components/ui/record-card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/format'

const METODOS_LABEL = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  otro: 'Otro',
}

const ESTADOS = [
  { value: 'todos', label: 'Todos' },
  { value: 'activo', label: 'Activo' },
  { value: 'anulado', label: 'Anulado' },
]

const POR_PAGINA = 20

function BotonComprobante({ pago }) {
  const mutation = useMutation({
    mutationFn: () => descargarComprobantePago(pago.id, pago.cliente_nombre),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo generar el comprobante'))
    },
  })

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      <FileText className="size-4" />
      {mutation.isPending ? 'Generando…' : 'Comprobante'}
    </Button>
  )
}

export function PagosPage() {
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
    queryKey: ['pagos', filtros],
    queryFn: () => fetchPagos(filtros),
  })

  const pagos = data?.pagos ?? []
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
        title="Pagos"
        description="Registro de pagos recibidos"
        actions={<NuevoPagoDialog trigger={<Button>Nuevo pago</Button>} />}
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
            No se pudo cargar el listado de pagos.
          </p>
        )}
        {!isLoading && pagos.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay pagos que coincidan con los filtros.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pagos.map((pago) => {
            const anulado = pago.estado === 'anulado'
            return (
              <RecordCard
                key={pago.id}
                className={anulado ? 'opacity-60' : undefined}
                title={pago.cliente_nombre}
                badge={
                  <Badge variant={anulado ? 'destructive' : 'success'}>
                    {anulado ? 'Anulado' : 'Activo'}
                  </Badge>
                }
                fields={[
                  {
                    label: 'Monto',
                    value: (
                      <span className={anulado ? 'line-through' : undefined}>
                        {formatCurrency(pago.monto)}
                      </span>
                    ),
                  },
                  { label: 'Fecha', value: formatDate(pago.fecha) },
                  { label: 'Método', value: METODOS_LABEL[pago.metodo] ?? pago.metodo },
                ]}
                actions={
                  <>
                    <BotonComprobante pago={pago} />
                    {!anulado && (
                      <AnularPagoDialog
                        pago={pago}
                        trigger={<Button variant="outline" size="sm">Anular</Button>}
                      />
                    )}
                  </>
                }
              />
            )
          })}
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {pagos.length} de {total}
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