import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { actualizarEstadoEmpleado, fetchEmpleados } from '@/api/empleados'
import { getApiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CrearEmpleadoSheet } from '@/components/empleados/CrearEmpleadoSheet'
import { EditarPermisosDialog } from '@/components/empleados/EditarPermisosDialog'
import { ResetearPasswordEmpleadoDialog } from '@/components/empleados/ResetearPasswordEmpleadoDialog'
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
import { useAuth } from '@/hooks/useAuth'

const ROL_LABEL = { admin: 'Admin', vendedor: 'Vendedor' }

export function EmpleadosPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: empleados, isLoading, isError } = useQuery({
    queryKey: ['empleados'],
    queryFn: fetchEmpleados,
  })

  const estadoMutation = useMutation({
    mutationFn: actualizarEstadoEmpleado,
    onSuccess: (empleado) => {
      toast.success(empleado.activo ? 'Empleado activado' : 'Empleado desactivado')
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo actualizar el estado'))
    },
  })

  return (
    <>
      <PageHeader
        title="Mi equipo"
        description="Empleados de tu negocio"
        actions={<CrearEmpleadoSheet />}
      />

      <div className="p-4 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Módulos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableEmpty colSpan={6}>Cargando…</TableEmpty>}

            {isError && <TableEmpty colSpan={6}>No se pudo cargar el equipo.</TableEmpty>}

            {empleados?.length === 0 && (
              <TableEmpty colSpan={6}>Todavía no agregaste empleados.</TableEmpty>
            )}

            {empleados?.map((empleado) => {
              // Un admin no puede desactivarse a sí mismo: el backend no lo
              // impide todavía, así que la protección vive acá. Comparamos
              // por id de sesión, no por email (más robusto ante duplicados).
              const esUnoMismo = empleado.id === user?.id

              return (
                <TableRow key={empleado.id}>
                  <TableCell className="font-medium">
                    {empleado.nombre_completo}
                    {esUnoMismo && <span className="ml-2 text-xs text-muted-foreground">(vos)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{empleado.email}</TableCell>
                  <TableCell>
                    <Badge>{ROL_LABEL[empleado.rol] ?? empleado.rol}</Badge>
                  </TableCell>
                  <TableCell>
                    {empleado.rol === 'admin' ? (
                      <span className="text-xs text-muted-foreground">Todos (admin)</span>
                    ) : empleado.permisos?.length > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {empleado.permisos.length} módulo(s)
                      </span>
                    ) : (
                      <span className="text-xs text-destructive">Sin módulos</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={empleado.activo ? 'success' : 'destructive'}>
                      {empleado.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {empleado.rol === 'vendedor' && (
                        <EditarPermisosDialog
                          empleado={empleado}
                          trigger={<Button variant="outline" size="sm">Módulos</Button>}
                        />
                      )}
                      <ResetearPasswordEmpleadoDialog
                        empleadoId={empleado.id}
                        nombreCompleto={empleado.nombre_completo}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={esUnoMismo || estadoMutation.isPending}
                        title={esUnoMismo ? 'No podés desactivarte a vos mismo' : undefined}
                        onClick={() =>
                          estadoMutation.mutate({ id: empleado.id, activo: !empleado.activo })
                        }
                      >
                        {empleado.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}