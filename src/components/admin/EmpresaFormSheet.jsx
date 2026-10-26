import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { actualizarPropietario, crearPropietario } from '@/api/admin'
import { getApiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDocumento } from '@/lib/documento'
import { etiquetaModulo, ordenarModulos, resumenCambiosModulos } from '@/lib/modulos'
import { ModulosEmpresaField } from './ModulosEmpresaField'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const PASSWORD_MIN = 6

// Mismo criterio que el back: DNI de 7-8 dígitos o CUIT/CUIL de 11 (el dígito verificador lo valida el back).
function documentoConFormatoValido(valor) {
  const digitos = valor.replace(/\D/g, '')
  return [7, 8, 11].includes(digitos.length)
}

const camposIniciales = {
  nombre_negocio: '',
  cuit: '',
  telefono: '',
  email_contacto: '',
  direccion: '',
  modulos: [],
  admin_nombre: '',
  admin_email: '',
  admin_password: '',
}

function formDesdeEmpresa(empresa) {
  if (!empresa) return camposIniciales
  return {
    ...camposIniciales,
    nombre_negocio: empresa.nombre_negocio ?? '',
    cuit: formatDocumento(empresa.cuit) ?? '',
    telefono: empresa.telefono ?? '',
    email_contacto: empresa.email_contacto ?? '',
    direccion: empresa.direccion ?? '',
    modulos: ordenarModulos(empresa.modulos ?? []),
  }
}

// Texto del diálogo de confirmación al editar: qué cambia en los módulos y qué efectos tiene.
function DescripcionCambios({ empresa, modulos }) {
  const { activados, desactivados, avisos, hayCambios } = resumenCambiosModulos(
    ordenarModulos(empresa.modulos ?? []),
    modulos
  )
  if (!hayCambios) return `Se van a actualizar los datos de ${empresa.nombre_negocio}.`
  return (
    <span className="flex flex-col gap-1.5">
      <span>Se van a actualizar los datos de {empresa.nombre_negocio}.</span>
      {activados.length > 0 && <span><strong>Se activan:</strong> {activados.map(etiquetaModulo).join(', ')}.</span>}
      {desactivados.length > 0 && <span><strong>Se desactivan:</strong> {desactivados.map(etiquetaModulo).join(', ')}.</span>}
      {avisos.map((aviso) => <span key={aviso}>• {aviso}</span>)}
      {desactivados.length > 0 && <span>Desactivar un módulo no borra datos: si se reactiva, todo vuelve a estar.</span>}
    </span>
  )
}

/**
 * Alta y edición de empresas (solo super admin).
 * - Alta: datos de la empresa + su primer administrador, que se crean juntos (todo o nada).
 * - Edición: datos y módulos contratados. Los usuarios se gestionan desde "Mi equipo"
 *   de la propia empresa (si lo tiene contratado).
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
    cuit: form.cuit.replace(/\D/g, ''),
    telefono: form.telefono.trim() || null,
    email_contacto: form.email_contacto.trim() || null,
    direccion: form.direccion.trim() || null,
    modulos: ordenarModulos(form.modulos),
  })

  const mutation = useMutation({
    mutationFn: () => {
      if (esEdicion) return actualizarPropietario({ id: empresa.id, ...datosEmpresa() })
      return crearPropietario({
        empresa: datosEmpresa(),
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
    if (!documentoConFormatoValido(form.cuit)) {
      toast.error('Ingresá un DNI (7 u 8 dígitos) o un CUIT/CUIL (11 dígitos)')
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-cuit">CUIT, CUIL o DNI del titular</Label>
            <Input id="emp-cuit" required inputMode="numeric" value={form.cuit}
              onChange={(e) => updateField('cuit', e.target.value)} placeholder="Ej: 20-30123456-7 o 30123456" />
            <p className="text-xs text-muted-foreground">
              Identifica a la empresa: no puede repetirse. Con o sin guiones y puntos.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-telefono">Teléfono</Label>
            <Input id="emp-telefono" type="tel" value={form.telefono}
              onChange={(e) => updateField('telefono', e.target.value)} placeholder="Opcional" />
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

          <ModulosEmpresaField value={form.modulos} onChange={(modulos) => updateField('modulos', modulos)} />

          {!esEdicion && (
            <>
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
          description={<DescripcionCambios empresa={empresa} modulos={ordenarModulos(form.modulos)} />}
          confirmLabel="Guardar cambios"
          confirmingLabel="Guardando…"
          isPending={mutation.isPending}
          onConfirm={() => mutation.mutateAsync().catch(() => {})}
        />
      )}
    </Sheet>
  )
}