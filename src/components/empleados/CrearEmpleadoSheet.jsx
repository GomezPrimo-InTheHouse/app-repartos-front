import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { crearEmpleado } from '@/api/empleados'
import { getApiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const initialForm = { email: '', password: '', nombreCompleto: '', rol: 'vendedor' }

export function CrearEmpleadoSheet() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => crearEmpleado(form),
    onSuccess: (empleado) => {
      toast.success(`${empleado.nombreCompleto} fue agregado al equipo`)
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      setForm(initialForm)
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo crear el empleado'))
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    mutation.mutate()
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Nuevo empleado</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Nuevo empleado</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-nombre">Nombre completo</Label>
            <Input
              id="emp-nombre"
              required
              value={form.nombreCompleto}
              onChange={(e) => updateField('nombreCompleto', e.target.value)}
              placeholder="Juan Pérez"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-email">Email</Label>
            <Input
              id="emp-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="juan@negocio.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-password">Contraseña</Label>
            <Input
              id="emp-password"
              inputMode="numeric"
              maxLength={6}
              required
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="6 dígitos"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-rol">Rol</Label>
            <Select value={form.rol} onValueChange={(value) => updateField('rol', value)}>
              <SelectTrigger id="emp-rol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendedor">Vendedor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={mutation.isPending} className="mt-2">
            {mutation.isPending ? 'Creando…' : 'Crear empleado'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}