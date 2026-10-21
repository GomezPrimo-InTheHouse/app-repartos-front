import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { actualizarPropietario, crearPropietario } from '@/api/admin'
import { getApiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const PASSWORD_MIN = 6

const camposIniciales = {
  nombre_negocio: '',
  cuit: '',
  telefono: '',
  email_contacto: '',
  direccion: '',
  usa_produccion: false,
  admin_nombre: '',
  admin_email: '',
  admin_password: '',
}

function formDesdeEmpresa(empresa) {
  if (!empresa) return camposIniciales
  return {
    ...camposIniciales,
    nombre_negocio: empresa.nombre_negocio ?? '',
    cuit: empresa.cuit ?? '',
    telefono: empresa.telefono ?? '',
    email_contacto: empresa.email_contacto ?? '',
    direccion: empresa.direccion ?? '',
  }
}

/**
 * Alta y edición de empresas (solo super admin).
 * - Alta: datos de la empresa + su primer administrador, que se crean juntos (todo o nada).
 * - Edición: solo los datos de la empresa. Los usuarios se gestionan desde "Mi equipo"
 *   de la propia empresa, y el módulo Producción desde la tarjeta.
 */
export function EmpresaFormSheet({ empresa, trigger }) {
  const esEdicion = Boolean(empresa)
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [form, setForm] = useState(() => formDesdeEmpresa(empresa))
  const queryClient = useQueryClient()

  function handleOpenChange(nextOpen) {
    if (nextOpen) setForm(formDesdeEmpresa(empresa))
    setOpen(nextOpen)
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const datosEmpresa = () => ({
    nombre_negocio: form.nombre_negocio.trim(),
    cuit: form.cuit.trim() || null,
    telefono: form.telefono.trim() || null,
    email_contacto: form.email_contacto.trim() || null,
    direccion: form.direccion.trim() || null,
  })

  const mutation = useMutation({
    mutationFn: () => {
      if (esEdicion) return actualizarPropietario({ id: empresa.id, ...datosEmpresa() })
      return crearPropietario({
        empresa: { ...datosEmpresa(), usa_produccion: form.usa_produccion },
        admin: {
          nombreCompleto: form.admin_nombre.trim(),
          email: form.admin_email.trim(),
          password: form.admin_password,
        },
      })
    },
    onSuccess: (propietario) => {
      toast.success(
        esEdicion
          ? 'Empresa actualizada'
          : `Empresa "${propietario.nombre_negocio}" creada. Ya puede ingresar con ${form.admin_email.trim()}.`
      )
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      setConfirmOpen(false)
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar la empresa'))
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.nombre_negocio.trim()) {
      toast.error('El nombre del negocio es obligatorio')
      return
    }
    if (!esEdicion && form.admin_password.trim().length < PASSWORD_MIN) {
      toast.error(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`)
      return
    }
    if (esEdicion) {
      setConfirmOpen(true)
    } else {
      mutation.mutate()
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{esEdicion ? 'Editar empresa' : 'Nueva empresa'}</SheetTitle>
          {!esEdicion && (
            <SheetDescription>
              Se crea la empresa junto con su primer administrador, que después podrá sumar a su equipo.
            </SheetDescription>
          )}
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Empresa</p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-nombre">Nombre del negocio</Label>
            <Input id="emp-nombre" required maxLength={120} value={form.nombre_negocio}
              onChange={(e) => updateField('nombre_negocio', e.target.value)} placeholder="Ej: Sodería Los Primos" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="emp-cuit">CUIT</Label>
              <Input id="emp-cuit" inputMode="numeric" value={form.cuit}
                onChange={(e) => updateField('cuit', e.target.value)} placeholder="Opcional" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="emp-telefono">Teléfono</Label>
              <Input id="emp-telefono" type="tel" value={form.telefono}
                onChange={(e) => updateField('telefono', e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-email">Email de contacto</Label>
            <Input id="emp-email" type="email" value={form.email_contacto}
              onChange={(e) => updateField('email_contacto', e.target.value)} placeholder="Opcional" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-direccion">Dirección</Label>
            <Input id="emp-direccion" value={form.direccion}
              onChange={(e) => updateField('direccion', e.target.value)} placeholder="Opcional" />
          </div>

          {!esEdicion && (
            <>
              <div className="flex items-start gap-2">
                <input
                  id="emp-produccion"
                  type="checkbox"
                  checked={form.usa_produccion}
                  onChange={(e) => updateField('usa_produccion', e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border"
                />
                <Label htmlFor="emp-produccion" className="cursor-pointer font-normal leading-snug">
                  Activar módulo Producción (control de stock). Se puede cambiar después.
                </Label>
              </div>

              <p className="mt-2 border-t border-border pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Administrador de la empresa
              </p>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="emp-admin-nombre">Nombre y apellido</Label>
                <Input id="emp-admin-nombre" required value={form.admin_nombre}
                  onChange={(e) => updateField('admin_nombre', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="emp-admin-email">Email (usuario de ingreso)</Label>
                <Input id="emp-admin-email" type="email" required autoComplete="off" value={form.admin_email}
                  onChange={(e) => updateField('admin_email', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="emp-admin-password">Contraseña inicial</Label>
                <Input id="emp-admin-password" type="text" required autoComplete="new-password"
                  minLength={PASSWORD_MIN} value={form.admin_password}
                  onChange={(e) => updateField('admin_password', e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Mínimo {PASSWORD_MIN} caracteres. Pasásela al cliente por un medio privado.
                </p>
              </div>
            </>
          )}

          <Button type="submit" disabled={mutation.isPending} className="mt-2">
            {mutation.isPending ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear empresa'}
          </Button>
        </form>
      </SheetContent>

      {esEdicion && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="¿Guardar los cambios?"
          description={`Se van a actualizar los datos de ${empresa.nombre_negocio}.`}
          confirmLabel="Guardar cambios"
          confirmingLabel="Guardando…"
          isPending={mutation.isPending}
          onConfirm={() => mutation.mutateAsync().catch(() => {})}
        />
      )}
    </Sheet>
  )
}