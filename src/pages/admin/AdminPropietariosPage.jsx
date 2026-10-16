import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { actualizarFeaturesPropietario, fetchPropietarios } from '@/api/admin'
import { getApiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/format'

const COLUMNAS = 4

export function AdminPropietariosPage() {
  // Empresa a la que se le está por cambiar el módulo Producción (abre el ConfirmDialog)
  const [aCambiar, setACambiar] = useState(null)
  const queryClient = useQueryClient()

  const { data: propietarios, isLoading, isError } = useQuery({
    queryKey: ['admin', 'propietarios'],
    queryFn: fetchPropietarios,
  })

  const produccionMutation = useMutation({
    mutationFn: ({ id, usa_produccion }) => actualizarFeaturesPropietario({ id, usa_produccion }),
    onSuccess: (propietario) => {
      toast.success(
        `Producción ${propietario.usa_produccion ? 'activada' : 'desactivada'} para ${propietario.nombre_negocio}`
      )
      queryClient.invalidateQueries({ queryKey: ['admin', 'propietarios'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo actualizar el módulo'))
    },
  })

  const activando = aCambiar ? !aCambiar.usa_produccion : false

  return (
    <>
      <PageHeader title="Empresas" description="Negocios dados de alta en el sistema" />

      <div className="p-4 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Negocio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Producción</TableHead>
              <TableHead>Creado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableEmpty colSpan={COLUMNAS}>Cargando…</TableEmpty>}

            {isError && <TableEmpty colSpan={COLUMNAS}>No se pudo cargar la lista de empresas.</TableEmpty>}

            {propietarios?.length === 0 && (
              <TableEmpty colSpan={COLUMNAS}>No hay empresas cargadas todavía.</TableEmpty>
            )}

            {propietarios?.map((propietario) => (
              <TableRow key={propietario.id}>
                <TableCell className="font-medium">{propietario.nombre_negocio}</TableCell>
                <TableCell>
                  <Badge variant={propietario.activo ? 'success' : 'destructive'}>
                    {propietario.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={propietario.usa_produccion ? 'success' : 'default'}>
                      {propietario.usa_produccion ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setACambiar(propietario)}
                      disabled={produccionMutation.isPending}
                    >
                      {propietario.usa_produccion ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(propietario.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Gap conocido de backend: 'activo' no bloquea nada todavía y no hay
            alta de empresas desde la UI. */}
        <p className="mt-3 text-xs text-muted-foreground">
          El alta de nuevas empresas y la posibilidad de desactivarlas se hacen hoy por SQL directo,
          todavía no están disponibles desde acá.
        </p>
      </div>

      <ConfirmDialog
        open={Boolean(aCambiar)}
        onOpenChange={(abierto) => { if (!abierto) setACambiar(null) }}
        title={
          aCambiar
            ? `¿${activando ? 'Activar' : 'Desactivar'} Producción para ${aCambiar.nombre_negocio}?`
            : ''
        }
        description={
          activando
            ? 'Desde ese momento cada despacho descuenta stock y se bloquea si no alcanza. Todos los productos arrancan con stock 0: la empresa tiene que cargar su stock inicial (Producción → Registrar → Ajuste +) antes de seguir despachando.'
            : 'Los despachos dejan de controlar y descontar stock, y el módulo Producción deja de verse. El stock y el historial cargados se conservan por si se vuelve a activar.'
        }
        confirmLabel={activando ? 'Activar' : 'Desactivar'}
        confirmingLabel="Guardando…"
        variant={activando ? 'default' : 'destructive'}
        isPending={produccionMutation.isPending}
        onConfirm={() =>
          produccionMutation.mutateAsync({ id: aCambiar.id, usa_produccion: activando }).catch(() => {})
        }
      />
    </>
  )
}