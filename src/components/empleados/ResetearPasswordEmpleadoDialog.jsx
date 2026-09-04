import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { resetearPasswordEmpleado } from '@/api/empleados'
import { getApiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResetearPasswordEmpleadoDialog({ empleadoId, nombreCompleto }) {
  const [open, setOpen] = useState(false)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => resetearPasswordEmpleado({ id: empleadoId, nuevaPassword }),
    onSuccess: () => {
      toast.success(`Contraseña actualizada para ${nombreCompleto}`)
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      setOpen(false)
      setNuevaPassword('')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo resetear la contraseña'))
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Resetear contraseña
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetear contraseña</DialogTitle>
          <DialogDescription>{nombreCompleto}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nuevaPasswordEmpleado">Nueva contraseña</Label>
            <Input
              id="nuevaPasswordEmpleado"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              placeholder="6 dígitos"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}