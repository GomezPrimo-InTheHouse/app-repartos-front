import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/api/client'
import { eliminarLista, fetchLista, fetchListas } from '@/api/repartos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ListaFormDialog } from '@/components/reparto/ListaFormDialog'
import { RecordCard } from '@/components/ui/record-card'

const DIA_LABEL = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

export function MisListasTab() {
  const [listaParaEditar, setListaParaEditar] = useState(null)
  const [editarDialogOpen, setEditarDialogOpen] = useState(false)
  const [cargandoEdicionId, setCargandoEdicionId] = useState(null)
  const queryClient = useQueryClient()

  const { data: listas, isLoading, isError } = useQuery({
    queryKey: ['repartos', 'listas'],
    queryFn: () => fetchListas({ activa: true }),
  })

  const eliminarMutation = useMutation({
    mutationFn: eliminarLista,
    onSuccess: () => {
      toast.success('Lista eliminada')
      queryClient.invalidateQueries({ queryKey: ['repartos', 'listas'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo eliminar la lista'))
    },
  })

  async function handleAbrirEdicion(listaId) {
    setCargandoEdicionId(listaId)
    try {
      const listaCompleta = await fetchLista(listaId)
      setListaParaEditar(listaCompleta)
      setEditarDialogOpen(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo cargar la lista'))
    } finally {
      setCargandoEdicionId(null)
    }
  }

  function handleEditarOpenChange(nextOpen) {
    setEditarDialogOpen(nextOpen)
    if (!nextOpen) setListaParaEditar(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ListaFormDialog trigger={<Button>Nueva lista</Button>} />
      </div>

      {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>}
      {isError && (
        <p className="py-8 text-center text-sm text-destructive">No se pudieron cargar las listas.</p>
      )}
      {listas?.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay listas de reparto todavía.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listas?.map((lista) => (
          <RecordCard
            key={lista.id}
            title={lista.nombre}
            badge={<Badge variant="outline">{lista.tipo === 'semanal' ? 'Semanal' : 'Única'}</Badge>}
            fields={[
              {
                label: lista.tipo === 'semanal' ? 'Día' : 'Fecha',
                value: lista.tipo === 'semanal' ? DIA_LABEL[lista.dia_semana] : lista.fecha,
              },
            ]}
            actions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAbrirEdicion(lista.id)}
                  disabled={cargandoEdicionId === lista.id}
                >
                  {cargandoEdicionId === lista.id ? 'Cargando…' : 'Editar'}
                </Button>
                <ConfirmDialog
                  trigger={<Button variant="destructive" size="sm">Eliminar</Button>}
                  title={`¿Eliminar "${lista.nombre}"?`}
                  description="La lista deja de generar repartos nuevos. El historial de ejecuciones ya generadas no se ve afectado."
                  confirmLabel="Eliminar"
                  confirmingLabel="Eliminando…"
                  variant="destructive"
                  isPending={eliminarMutation.isPending}
                  onConfirm={() => eliminarMutation.mutate(lista.id)}
                />
              </>
            }
          />
        ))}
      </div>

      {/* Dialog de edición, controlado: se abre programáticamente recién
          cuando fetchLista() ya trajo la lista completa con sus items. */}
      {listaParaEditar && (
        <ListaFormDialog
          lista={listaParaEditar}
          open={editarDialogOpen}
          onOpenChange={handleEditarOpenChange}
        />
      )}
    </div>
  )
}