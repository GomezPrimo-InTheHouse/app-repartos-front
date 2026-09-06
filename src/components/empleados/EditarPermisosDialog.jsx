import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { actualizarPermisosEmpleado, fetchModulosDisponibles } from '@/api/empleados'
import { getApiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

export function EditarPermisosDialog({ empleado, trigger }) {
  const [open, setOpen] = useState(false)
  const [permisos, setPermisos] = useState(empleado.permisos ?? [])
  const queryClient = useQueryClient()

  const { data: modulos } = useQuery({
    queryKey: ['empleados', 'modulos-disponibles'],
    queryFn: fetchModulosDisponibles,
    enabled: open,
  })

  function handleOpenChange(nextOpen) {
    if (nextOpen) setPermisos(empleado.permisos ?? [])
    setOpen(nextOpen)
  }

  function togglePermiso(clave) {
    setPermisos((prev) =>
      prev.includes(clave) ? prev.filter((p) => p !== clave) : [...prev, clave]
    )
  }

  const mutation = useMutation({
    mutationFn: () => actualizarPermisosEmpleado({ id: empleado.id, permisos }),
    onSuccess: () => {
      toast.success(`Permisos de ${empleado.nombre_completo} actualizados`)
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudieron actualizar los permisos'))
    },
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Módulos permitidos</DialogTitle>
          <DialogDescription>{empleado.nombre_completo}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 rounded-md border border-border p-3">
          {modulos?.map((modulo) => (
            <label key={modulo.clave} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={permisos.includes(modulo.clave)}
                onChange={() => togglePermiso(modulo.clave)}
                className="size-4 rounded border-border"
              />
              {modulo.etiqueta}
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}