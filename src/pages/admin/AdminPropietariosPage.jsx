import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { actualizarEstadoPropietario, actualizarFeaturesPropietario, fetchPropietarios } from '@/api/admin'
import { getApiErrorMessage } from '@/api/client'
import { EmpresaFormSheet } from '@/components/admin/EmpresaFormSheet'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { RecordCard } from '@/components/ui/record-card'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const FILTROS = [
  { value: 'activas', label: 'Activas' },
  { value: 'inactivas', label: 'Inactivas' },
  { value: 'todas', label: 'Todas' },
]

// Texto del diálogo de confirmación según la acción pedida sobre una empresa.
function textosConfirmacion(accion) {
  if (!accion) return { title: '', description: '', confirmLabel: '', variant: 'default' }
  const { tipo, empresa } = accion

  if (tipo === 'produccion') {
    const activando = !empresa.usa_produccion
    return {
      title: `¿${activando ? 'Activar' : 'Desactivar'} Producción para ${empresa.nombre_negocio}?`,
      description: activando
        ? 'Desde ese momento cada despacho descuenta stock y se bloquea si no alcanza. Todos los productos arrancan con stock 0: la empresa tiene que cargar su stock inicial (Producción → Registrar → Ajuste +) antes de seguir despachando.'
        : 'Los despachos dejan de controlar y descontar stock, y el módulo Producción deja de verse. El stock y el historial cargados se conservan por si se vuelve a activar.',
      confirmLabel: activando ? 'Activar' : 'Desactivar',
      variant: activando ? 'default' : 'destructive',
    }
  }

  const desactivando = empresa.activo
  const usuarios = empresa.cantidad_usuarios ?? 0
  return {
    title: `¿${desactivando ? 'Dar de baja' : 'Reactivar'} ${empresa.nombre_negocio}?`,
    description: desactivando
      ? `Sus ${usuarios} usuario${usuarios === 1 ? '' : 's'} no van a poder ingresar, y quien esté usando el sistema pierde el acceso en su próxima acción. No se borra ningún dato: se puede reactivar cuando quieras.`
      : 'Sus usuarios activos vuelven a poder ingresar con sus mismas credenciales y con todos sus datos intactos.',
    confirmLabel: desactivando ? 'Dar de baja' : 'Reactivar',
    variant: desactivando ? 'destructive' : 'default',
  }
}

export function AdminPropietariosPage() {
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('activas')
  // { tipo: 'produccion' | 'estado', empresa } — abre el ConfirmDialog
  const [accion, setAccion] = useState(null)
  const queryClient = useQueryClient()

  const { data: propietarios, isLoading, isError } = useQuery({
    queryKey: ['admin', 'propietarios'],
    queryFn: fetchPropietarios,
  })

  const accionMutation = useMutation({
    mutationFn: ({ tipo, empresa }) =>
      tipo === 'produccion'
        ? actualizarFeaturesPropietario({ id: empresa.id, usa_produccion: !empresa.usa_produccion })
        : actualizarEstadoPropietario({ id: empresa.id, activo: !empresa.activo }),
    onSuccess: (propietario, { tipo }) => {
      toast.success(
        tipo === 'produccion'
          ? `Producción ${propietario.usa_produccion ? 'activada' : 'desactivada'} para ${propietario.nombre_negocio}`
          : `${propietario.nombre_negocio} ${propietario.activo ? 'reactivada' : 'dada de baja'}`
      )
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo actualizar la empresa'))
    },
  })

  const texto = busqueda.trim().toLowerCase()
  const visibles = (propietarios ?? []).filter((p) => {
    if (filtro === 'activas' && !p.activo) return false
    if (filtro === 'inactivas' && p.activo) return false
    if (!texto) return true
    return [p.nombre_negocio, p.cuit, p.email_admin, p.email_contacto]
      .some((campo) => campo?.toLowerCase().includes(texto))
  })

  const confirmacion = textosConfirmacion(accion)

  return (
    <>
      <PageHeader
        title="Empresas"
        description="Negocios dados de alta en el sistema"
        actions={<EmpresaFormSheet trigger={<Button>Nueva empresa</Button>} />}
      />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, CUIT o email…" className="pl-9" />
          </div>
          <div className="flex gap-1 rounded-md border border-border p-1">
            {FILTROS.map((f) => (
              <Button key={f.value} type="button" size="sm" variant="ghost"
                onClick={() => setFiltro(f.value)}
                className={cn('flex-1', filtro === f.value && 'bg-secondary text-secondary-foreground')}>
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>}
        {isError && (
          <p className="py-8 text-center text-sm text-destructive">No se pudo cargar la lista de empresas.</p>
        )}
        {!isLoading && !isError && visibles.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {propietarios?.length ? 'No hay empresas que coincidan.' : 'No hay empresas cargadas todavía.'}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((empresa) => (
            <RecordCard
              key={empresa.id}
              title={empresa.nombre_negocio}
              className={cn(!empresa.activo && 'opacity-70')}
              badge={
                <Badge variant={empresa.activo ? 'success' : 'destructive'} className="shrink-0">
                  {empresa.activo ? 'Activa' : 'De baja'}
                </Badge>
              }
              fields={[
                { label: 'Administrador', value: empresa.email_admin ?? 'Sin admin' },
                { label: 'Usuarios', value: empresa.cantidad_usuarios ?? 0 },
                {
                  label: 'Producción',
                  value: (
                    <Badge variant={empresa.usa_produccion ? 'success' : 'default'}>
                      {empresa.usa_produccion ? 'Activo' : 'Inactivo'}
                    </Badge>
                  ),
                },
                { label: 'CUIT', value: empresa.cuit },
                { label: 'Teléfono', value: empresa.telefono },
                { label: 'Alta', value: formatDate(empresa.created_at) },
              ]}
              actions={
                <div className="flex flex-wrap justify-end gap-1.5">
                  <EmpresaFormSheet empresa={empresa}
                    trigger={<Button variant="outline" size="sm">Editar</Button>} />
                  <Button type="button" variant="outline" size="sm"
                    disabled={accionMutation.isPending || !empresa.activo}
                    onClick={() => setAccion({ tipo: 'produccion', empresa })}>
                    {empresa.usa_produccion ? 'Quitar Producción' : 'Activar Producción'}
                  </Button>
                  <Button type="button" size="sm"
                    variant={empresa.activo ? 'outline' : 'default'}
                    className={cn(empresa.activo && 'text-destructive hover:text-destructive')}
                    disabled={accionMutation.isPending}
                    onClick={() => setAccion({ tipo: 'estado', empresa })}>
                    {empresa.activo ? 'Dar de baja' : 'Reactivar'}
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(accion)}
        onOpenChange={(abierto) => { if (!abierto) setAccion(null) }}
        title={confirmacion.title}
        description={confirmacion.description}
        confirmLabel={confirmacion.confirmLabel}
        confirmingLabel="Guardando…"
        variant={confirmacion.variant}
        isPending={accionMutation.isPending}
        onConfirm={() => accionMutation.mutateAsync(accion).catch(() => {})}
      />
    </>
  )
}