import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { eliminarCliente, fetchEnvasesCliente } from '@/api/clientes'
import { getApiErrorMessage } from '@/api/client'
import { AjusteEnvaseDialog } from '@/components/clientes/AjusteEnvaseDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SaldoValor } from '@/components/clientes/SaldoValor'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/format'

/**
 * "Ver cliente" — dialog de solo lectura con todos los datos del registro,
 * más el botón "Eliminar" (baja lógica) adentro, vía ConfirmDialog controlado,
 * y la sección de envases retornables en poder del cliente.
 */
export function ClienteDetalleDialog({ cliente, trigger }) {
  const [open, setOpen] = useState(false)
  const [confirmEliminarOpen, setConfirmEliminarOpen] = useState(false)
  const queryClient = useQueryClient()

  // Envases: se traen recién al abrir el dialog (enabled: open), ya que el
  // listado general de clientes no los incluye — misma lógica que el
  // detalle de despacho con sus items.
  const { data: envases } = useQuery({
    queryKey: ['clientes', cliente.id, 'envases'],
    queryFn: () => fetchEnvasesCliente(cliente.id),
    enabled: open,
  })

  const eliminarMutation = useMutation({
    mutationFn: () => eliminarCliente(cliente.id),
    onSuccess: () => {
      toast.success(`${cliente.nombre} fue dado de baja`)
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setConfirmEliminarOpen(false)
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo dar de baja al cliente'))
    },
  })

  // Dirección completa: arma "Dirección, Barrio, Localidad" solo con las
  // partes que existan, sin comas colgando si falta alguna.
  const direccionCompleta = [cliente.direccion, cliente.barrio, cliente.localidad]
    .filter(Boolean)
    .join(', ')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {/* flex-col en vez de flex-row justify-between: el badge quedaba a
            la derecha, justo donde DialogContent posiciona el botón "✕" de
            cerrar, y se superponían. Ahora el badge va debajo del nombre.
            pr-8 deja aire para el "✕" por si el nombre es largo. */}
        <DialogHeader className="flex flex-col items-start gap-1.5 space-y-0 pr-8">
          <DialogTitle>{cliente.nombre}</DialogTitle>
          <Badge variant={cliente.activo ? 'success' : 'destructive'}>
            {cliente.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <DetalleCampo label="Saldo" value={<SaldoValor saldo={cliente.saldo} />} span2 />
          <DetalleCampo label="DNI" value={cliente.dni} mono />
          <DetalleCampo label="Teléfono" value={cliente.telefono} />
          <DetalleCampo label="Días de crédito" value={cliente.dias_credito} mono />
          <DetalleCampo
            label="Límite de crédito"
            value={cliente.limite_credito > 0 ? formatCurrency(cliente.limite_credito) : 'Sin límite'}
            mono
          />
          <DetalleCampo label="Cliente desde" value={formatDate(cliente.created_at)} />
          <DetalleCampo label="Dirección" value={direccionCompleta || cliente.direccion} span2 />
          {cliente.notas && (
            <DetalleCampo label="Notas / instrucciones de entrega" value={cliente.notas} span2 />
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Envases en poder del cliente</span>
            <AjusteEnvaseDialog
              clienteId={cliente.id}
              clienteNombre={cliente.nombre}
              trigger={<Button variant="outline" size="sm">Ajuste manual</Button>}
            />
          </div>
          {envases && envases.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin movimientos de envases todavía.</p>
          )}
          {envases?.map((e) => (
            <div key={e.producto_id} className="flex items-center justify-between text-sm">
              <span>{e.producto_nombre}</span>
              <span className="font-mono-num font-semibold">{e.saldo}</span>
            </div>
          ))}
        </div>

        <DialogFooter>
          {cliente.activo && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmEliminarOpen(true)}
            >
              Eliminar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={confirmEliminarOpen}
        onOpenChange={setConfirmEliminarOpen}
        variant="destructive"
        title={`¿Dar de baja a ${cliente.nombre}?`}
        description='No se borra el registro: el cliente pasa a "Inactivo" y deja de aparecer en el filtro de activos. Podés reactivarlo después editándolo.'
        confirmLabel="Dar de baja"
        confirmingLabel="Dando de baja…"
        isPending={eliminarMutation.isPending}
        onConfirm={() => eliminarMutation.mutate()}
      />
    </Dialog>
  )
}

function DetalleCampo({ label, value, mono = false, span2 = false }) {
  return (
    <div className={span2 ? 'col-span-2 flex flex-col gap-0.5' : 'flex flex-col gap-0.5'}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono-num text-sm' : 'text-sm'}>{value || '—'}</span>
    </div>
  )
}