import { useQuery } from '@tanstack/react-query'
import { fetchPropietarios } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
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

export function AdminPropietariosPage() {
  const { data: propietarios, isLoading, isError } = useQuery({
    queryKey: ['admin', 'propietarios'],
    queryFn: fetchPropietarios,
  })

  return (
    <>
      <PageHeader title="Empresas" description="Negocios dados de alta en el sistema" />

      <div className="p-4 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Negocio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableEmpty colSpan={3}>Cargando…</TableEmpty>}

            {isError && <TableEmpty colSpan={3}>No se pudo cargar la lista de empresas.</TableEmpty>}

            {propietarios?.length === 0 && (
              <TableEmpty colSpan={3}>No hay empresas cargadas todavía.</TableEmpty>
            )}

            {propietarios?.map((propietario) => (
              <TableRow key={propietario.id}>
                <TableCell className="font-medium">{propietario.nombre_negocio}</TableCell>
                <TableCell>
                  <Badge variant={propietario.activo ? 'success' : 'destructive'}>
                    {propietario.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(propietario.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Gap conocido de backend: 'activo' no bloquea nada todavía y no hay
            alta de empresas desde la UI — por eso no hay acciones en esta tabla. */}
        <p className="mt-3 text-xs text-muted-foreground">
          El alta de nuevas empresas y la posibilidad de desactivarlas se hacen hoy por SQL directo,
          todavía no están disponibles desde acá.
        </p>
      </div>
    </>
  )
}