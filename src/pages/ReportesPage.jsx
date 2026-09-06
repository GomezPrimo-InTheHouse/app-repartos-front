import { useMutation, useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { fetchClientes } from '@/api/clientes'
import { getApiErrorMessage } from '@/api/client'
import { descargarReporteCliente, descargarReporteGeneral } from '@/api/reportes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

/**
 * Rango de fechas default: último mes. Es solo una sugerencia inicial en
 * los inputs, el usuario puede cambiarlo o borrarlo para pedir el
 * histórico completo — el backend recomendó explícitamente ofrecer un
 * rango por default en vez de invitar a pedir "todo" como primera opción.
 */
function rangoUltimoMes() {
  const hasta = new Date()
  const desde = new Date()
  desde.setMonth(desde.getMonth() - 1)
  const formato = (d) => d.toISOString().slice(0, 10)
  return { desde: formato(desde), hasta: formato(hasta) }
}

export function ReportesPage() {
  const [clienteId, setClienteId] = useState('')
  const [rangoCliente, setRangoCliente] = useState(rangoUltimoMes)
  const [rangoGeneral, setRangoGeneral] = useState(rangoUltimoMes)

  const { data: clientes } = useQuery({
    queryKey: ['clientes', { paraSelector: true }],
    queryFn: () => fetchClientes({}),
  })

  const clienteSeleccionado = clientes?.find((c) => c.id === clienteId)

  const mutationCliente = useMutation({
    mutationFn: () =>
      descargarReporteCliente(clienteId, clienteSeleccionado.nombre, rangoCliente),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo generar el estado de cuenta'))
    },
  })

  const mutationGeneral = useMutation({
    mutationFn: () => descargarReporteGeneral(rangoGeneral),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo generar el reporte general'))
    },
  })

  function handleDescargarCliente() {
    if (!clienteId) {
      toast.error('Elegí un cliente')
      return
    }
    mutationCliente.mutate()
  }

  return (
    <>
      <PageHeader title="Reportes" description="Estados de cuenta y resumen general del negocio" />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado de cuenta por cliente</CardTitle>
            <CardDescription>
              Historial de despachos y pagos de un cliente puntual, con saldo resultante.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reporte-cliente">Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger id="reporte-cliente">
                  <SelectValue placeholder="Elegí un cliente…" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reporte-cliente-desde">Desde</Label>
                <Input
                  id="reporte-cliente-desde"
                  type="date"
                  value={rangoCliente.desde}
                  onChange={(e) => setRangoCliente((prev) => ({ ...prev, desde: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reporte-cliente-hasta">Hasta</Label>
                <Input
                  id="reporte-cliente-hasta"
                  type="date"
                  value={rangoCliente.hasta}
                  onChange={(e) => setRangoCliente((prev) => ({ ...prev, hasta: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Dejá ambos campos vacíos para traer el historial completo del cliente.
            </p>

            <Button
              type="button"
              onClick={handleDescargarCliente}
              disabled={mutationCliente.isPending}
              className="self-start"
            >
              <Download className="size-4" />
              {mutationCliente.isPending ? 'Generando…' : 'Descargar estado de cuenta'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen general del negocio</CardTitle>
            <CardDescription>
              Total despachado, total pagado, pagos por método y productos más vendidos en el período.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reporte-general-desde">Desde</Label>
                <Input
                  id="reporte-general-desde"
                  type="date"
                  value={rangoGeneral.desde}
                  onChange={(e) => setRangoGeneral((prev) => ({ ...prev, desde: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reporte-general-hasta">Hasta</Label>
                <Input
                  id="reporte-general-hasta"
                  type="date"
                  value={rangoGeneral.hasta}
                  onChange={(e) => setRangoGeneral((prev) => ({ ...prev, hasta: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Dejá ambos campos vacíos para traer el histórico completo del negocio.
            </p>

            <Button
              type="button"
              onClick={() => mutationGeneral.mutate()}
              disabled={mutationGeneral.isPending}
              className="self-start"
            >
              <Download className="size-4" />
              {mutationGeneral.isPending ? 'Generando…' : 'Descargar resumen general'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}