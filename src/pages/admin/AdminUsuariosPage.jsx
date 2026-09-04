import { useQuery } from '@tanstack/react-query'
import { fetchUsuarios } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { ResetearPasswordDialog } from '@/components/admin/ResetearPasswordDialog'
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

const ROL_LABEL = {
  super_admin: 'Super admin',
  admin: 'Admin',
  vendedor: 'Vendedor',
}

export function AdminUsuariosPage() {
  const { data: usuarios, isLoading, isError } = useQuery({
    queryKey: ['admin', 'usuarios'],
    queryFn: fetchUsuarios,
  })

  return (
    <>
      <PageHeader title="Usuarios" description="Todos los usuarios registrados en el sistema" />

      <div className="p-4 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Negocio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableEmpty colSpan={6}>Cargando…</TableEmpty>}

            {isError && (
              <TableEmpty colSpan={6}>No se pudo cargar la lista de usuarios.</TableEmpty>
            )}

            {usuarios?.length === 0 && <TableEmpty colSpan={6}>No hay usuarios cargados.</TableEmpty>}

            {usuarios?.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.email}</TableCell>
                <TableCell>{usuario.nombre_completo}</TableCell>
                <TableCell>
                  <Badge variant={usuario.rol === 'super_admin' ? 'warning' : 'default'}>
                    {ROL_LABEL[usuario.rol] ?? usuario.rol}
                  </Badge>
                </TableCell>
                {/* super_admin no tiene negocio asociado — no es un dato faltante, es esperable */}
                <TableCell className="text-muted-foreground">
                  {usuario.nombre_negocio ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={usuario.activo ? 'success' : 'destructive'}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ResetearPasswordDialog email={usuario.email} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}