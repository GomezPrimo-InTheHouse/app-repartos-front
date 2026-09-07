// import { useMutation, useQueryClient } from '@tanstack/react-query'
// import { useState } from 'react'
// import { toast } from 'sonner'
// import { actualizarCliente, crearCliente } from '@/api/clientes'
// import { getApiErrorMessage } from '@/api/client'
// import { Button } from '@/components/ui/button'
// import { ConfirmDialog } from '@/components/ui/confirm-dialog'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
// import { Textarea } from '@/components/ui/textarea'

// const camposIniciales = {
//   nombre: '',
//   dni: '',
//   telefono: '',
//   direccion: '',
//   barrio: '',
//   localidad: '',
//   dias_credito: '30',
//   limite_credito: '0',
//   foto_url: '',
//   notas: '',
// }

// function formDesdeCliente(cliente) {
//   if (!cliente) return camposIniciales
//   return {
//     nombre: cliente.nombre ?? '',
//     dni: cliente.dni ?? '',
//     telefono: cliente.telefono ?? '',
//     direccion: cliente.direccion ?? '',
//     barrio: cliente.barrio ?? '',
//     localidad: cliente.localidad ?? '',
//     dias_credito: String(cliente.dias_credito ?? 30),
//     limite_credito: String(cliente.limite_credito ?? 0),
//     foto_url: cliente.foto_url ?? '',
//     notas: cliente.notas ?? '',
//   }
// }

// export function ClienteFormSheet({ cliente, trigger }) {
//   const esEdicion = Boolean(cliente)
//   const [open, setOpen] = useState(false)
//   const [confirmOpen, setConfirmOpen] = useState(false)
//   const [form, setForm] = useState(() => formDesdeCliente(cliente))
//   const queryClient = useQueryClient()

//   function handleOpenChange(nextOpen) {
//     if (nextOpen) setForm(formDesdeCliente(cliente))
//     setOpen(nextOpen)
//   }

//   const mutation = useMutation({
//     mutationFn: () => {
//       const payload = {
//         ...form,
//         // dni vacío se manda como null, no como string vacío — el backend
//         // lo trata como "sin DNI cargado" (campo opcional).
//         dni: form.dni.trim() || null,
//         dias_credito: Number(form.dias_credito) || 0,
//         limite_credito: Number(form.limite_credito) || 0,
//       }
//       return esEdicion ? actualizarCliente({ id: cliente.id, ...payload }) : crearCliente(payload)
//     },
//     onSuccess: () => {
//       toast.success(esEdicion ? 'Cliente actualizado' : 'Cliente creado')
//       queryClient.invalidateQueries({ queryKey: ['clientes'] })
//       setOpen(false)
//     },
//     onError: (error) => {
//       toast.error(getApiErrorMessage(error, 'No se pudo guardar el cliente'))
//     },
//   })

//   function handleSubmit(event) {
//     event.preventDefault()
//     if (esEdicion) {
//       setConfirmOpen(true)
//     } else {
//       mutation.mutate()
//     }
//   }

//   function updateField(field, value) {
//     setForm((prev) => ({ ...prev, [field]: value }))
//   }

//   // Filtra cualquier carácter no numérico a medida que se tipea — evita
//   // depender solo de la validación del backend para el caso más común
//   // (usuario escribe puntos o espacios en el DNI sin querer).
//   function handleDniChange(value) {
//     updateField('dni', value.replace(/\D/g, ''))
//   }

//   return (
//     <Sheet open={open} onOpenChange={handleOpenChange}>
//       <SheetTrigger asChild>{trigger}</SheetTrigger>
//       <SheetContent side="right">
//         <SheetHeader>
//           <SheetTitle>{esEdicion ? 'Editar cliente' : 'Nuevo cliente'}</SheetTitle>
//         </SheetHeader>
//         <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//           <div className="flex flex-col gap-1.5">
//             <Label htmlFor="cli-nombre">Nombre</Label>
//             <Input id="cli-nombre" required value={form.nombre}
//               onChange={(e) => updateField('nombre', e.target.value)} placeholder="Nombre y apellido" />
//           </div>

//           <div className="flex flex-col gap-1.5">
//             <Label htmlFor="cli-dni">DNI</Label>
//             <Input id="cli-dni" inputMode="numeric" value={form.dni}
//               onChange={(e) => handleDniChange(e.target.value)} placeholder="Opcional — solo números" />
//           </div>

//           <div className="flex flex-col gap-1.5">
//             <Label htmlFor="cli-telefono">Teléfono</Label>
//             <Input id="cli-telefono" type="tel" value={form.telefono}
//               onChange={(e) => updateField('telefono', e.target.value)} placeholder="Opcional" />
//           </div>
//           <div className="flex flex-col gap-1.5">
//             <Label htmlFor="cli-direccion">Dirección</Label>
//             <Input id="cli-direccion" value={form.direccion}
//               onChange={(e) => updateField('direccion', e.target.value)} placeholder="Opcional" />
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <div className="flex flex-col gap-1.5">
//               <Label htmlFor="cli-barrio">Barrio</Label>
//               <Input id="cli-barrio" value={form.barrio}
//                 onChange={(e) => updateField('barrio', e.target.value)} placeholder="Opcional" />
//             </div>
//             <div className="flex flex-col gap-1.5">
//               <Label htmlFor="cli-localidad">Localidad</Label>
//               <Input id="cli-localidad" value={form.localidad}
//                 onChange={(e) => updateField('localidad', e.target.value)} placeholder="Opcional" />
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <div className="flex flex-col gap-1.5">
//               <Label htmlFor="cli-dias">Días de crédito</Label>
//               <Input id="cli-dias" type="number" min="0" inputMode="numeric" value={form.dias_credito}
//                 onChange={(e) => updateField('dias_credito', e.target.value)} />
//             </div>
//             <div className="flex flex-col gap-1.5">
//               <Label htmlFor="cli-limite">Límite de crédito</Label>
//               <Input id="cli-limite" type="number" min="0" inputMode="numeric" value={form.limite_credito}
//                 onChange={(e) => updateField('limite_credito', e.target.value)} />
//               <p className="text-xs text-muted-foreground">0 = sin límite definido</p>
//             </div>
//           </div>
//           <div className="flex flex-col gap-1.5">
//             <Label htmlFor="cli-foto">URL de foto</Label>
//             <Input id="cli-foto" value={form.foto_url}
//               onChange={(e) => updateField('foto_url', e.target.value)}
//               placeholder="Opcional — todavía no hay subida de imagen, solo URL" />
//           </div>
//           <div className="flex flex-col gap-1.5">
//             <Label htmlFor="cli-notas">Notas</Label>
//             <Textarea id="cli-notas" value={form.notas}
//               onChange={(e) => updateField('notas', e.target.value)}
//               placeholder="Ej: instrucciones de entrega, horarios, preferencias…" />
//             <p className="text-xs text-muted-foreground">
//               Se muestra también en "Reparto de hoy" al repartidor.
//             </p>
//           </div>
//           <Button type="submit" disabled={mutation.isPending} className="mt-2">
//             {mutation.isPending ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear cliente'}
//           </Button>
//         </form>
//       </SheetContent>

//       {esEdicion && (
//         <ConfirmDialog
//           open={confirmOpen}
//           onOpenChange={setConfirmOpen}
//           variant="default"
//           title="¿Guardar los cambios?"
//           description={`Se van a actualizar los datos de ${cliente.nombre}.`}
//           confirmLabel="Guardar cambios"
//           confirmingLabel="Guardando…"
//           isPending={mutation.isPending}
//           onConfirm={() => mutation.mutate()}
//         />
//       )}
//     </Sheet>
//   )
// }

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { actualizarCliente, crearCliente } from '@/api/clientes'
import { getApiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

const camposIniciales = {
  nombre: '',
  dni: '',
  telefono: '',
  direccion: '',
  barrio: '',
  localidad: '',
  dias_credito: '30',
  limite_credito: '0',
  foto_url: '',
  notas: '',
}

function formDesdeCliente(cliente) {
  if (!cliente) return camposIniciales
  return {
    nombre: cliente.nombre ?? '',
    dni: cliente.dni ?? '',
    telefono: cliente.telefono ?? '',
    direccion: cliente.direccion ?? '',
    barrio: cliente.barrio ?? '',
    localidad: cliente.localidad ?? '',
    dias_credito: String(cliente.dias_credito ?? 30),
    limite_credito: String(cliente.limite_credito ?? 0),
    foto_url: cliente.foto_url ?? '',
    notas: cliente.notas ?? '',
  }
}

export function ClienteFormSheet({ cliente, trigger }) {
  const esEdicion = Boolean(cliente)
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [form, setForm] = useState(() => formDesdeCliente(cliente))
  const queryClient = useQueryClient()

  function handleOpenChange(nextOpen) {
    if (nextOpen) setForm(formDesdeCliente(cliente))
    setOpen(nextOpen)
  }

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        // dni vacío se manda como null, no como string vacío — el backend
        // lo trata como "sin DNI cargado" (campo opcional).
        dni: form.dni.trim() || null,
        dias_credito: Number(form.dias_credito) || 0,
        limite_credito: Number(form.limite_credito) || 0,
      }
      return esEdicion ? actualizarCliente({ id: cliente.id, ...payload }) : crearCliente(payload)
    },
    onSuccess: () => {
      toast.success(esEdicion ? 'Cliente actualizado' : 'Cliente creado')
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el cliente'))
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    if (esEdicion) {
      setConfirmOpen(true)
    } else {
      mutation.mutate()
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Filtra cualquier carácter no numérico a medida que se tipea — evita
  // depender solo de la validación del backend para el caso más común
  // (usuario escribe puntos o espacios en el DNI sin querer).
  function handleDniChange(value) {
    updateField('dni', value.replace(/\D/g, ''))
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      {/* flex flex-col + h-full: define el sheet como columna con altura fija,
          así el body del medio puede scrollear (overflow-y-auto) mientras
          header y footer quedan siempre visibles. Sin esto, en mobile el
          form se desbordaba y no había forma de llegar al botón. */}
      <SheetContent side="right" className="flex h-full flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{esEdicion ? 'Editar cliente' : 'Nuevo cliente'}</SheetTitle>
        </SheetHeader>

        <form
          id="cliente-form"
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cli-nombre">Nombre</Label>
            <Input id="cli-nombre" required value={form.nombre}
              onChange={(e) => updateField('nombre', e.target.value)} placeholder="Nombre y apellido" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cli-dni">DNI</Label>
            <Input id="cli-dni" inputMode="numeric" value={form.dni}
              onChange={(e) => handleDniChange(e.target.value)} placeholder="Opcional — solo números" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cli-telefono">Teléfono</Label>
            <Input id="cli-telefono" type="tel" value={form.telefono}
              onChange={(e) => updateField('telefono', e.target.value)} placeholder="Opcional" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cli-direccion">Dirección</Label>
            <Input id="cli-direccion" value={form.direccion}
              onChange={(e) => updateField('direccion', e.target.value)} placeholder="Opcional" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cli-barrio">Barrio</Label>
              <Input id="cli-barrio" value={form.barrio}
                onChange={(e) => updateField('barrio', e.target.value)} placeholder="Opcional" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cli-localidad">Localidad</Label>
              <Input id="cli-localidad" value={form.localidad}
                onChange={(e) => updateField('localidad', e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cli-dias">Días de crédito</Label>
              <Input id="cli-dias" type="number" min="0" inputMode="numeric" value={form.dias_credito}
                onChange={(e) => updateField('dias_credito', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cli-limite">Límite de crédito</Label>
              <Input id="cli-limite" type="number" min="0" inputMode="numeric" value={form.limite_credito}
                onChange={(e) => updateField('limite_credito', e.target.value)} />
              <p className="text-xs text-muted-foreground">0 = sin límite definido</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cli-foto">URL de foto</Label>
            <Input id="cli-foto" value={form.foto_url}
              onChange={(e) => updateField('foto_url', e.target.value)}
              placeholder="Opcional — todavía no hay subida de imagen, solo URL" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cli-notas">Notas</Label>
            <Textarea id="cli-notas" value={form.notas}
              onChange={(e) => updateField('notas', e.target.value)}
              placeholder="Ej: instrucciones de entrega, horarios, preferencias…" />
            <p className="text-xs text-muted-foreground">
              Se muestra también en "Reparto de hoy" al repartidor.
            </p>
          </div>
        </form>

        {/* Footer fijo fuera del área scrolleable: el botón de guardar
            siempre está visible, sin depender de llegar al final del form. */}
        <div className="border-t px-6 py-4">
          <Button type="submit" form="cliente-form" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </div>
      </SheetContent>

      {esEdicion && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          variant="default"
          title="¿Guardar los cambios?"
          description={`Se van a actualizar los datos de ${cliente.nombre}.`}
          confirmLabel="Guardar cambios"
          confirmingLabel="Guardando…"
          isPending={mutation.isPending}
          onConfirm={() => mutation.mutate()}
        />
      )}
    </Sheet>
  )
}