// import { useMutation, useQueryClient } from '@tanstack/react-query'
// import { useState } from 'react'
// import { toast } from 'sonner'
// import { actualizarCliente, crearCliente } from '@/api/clientes'
// import { getApiErrorMessage } from '@/api/client'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
// import { Textarea } from '@/components/ui/textarea'

// const camposIniciales = {
//   nombre: '',
//   telefono: '',
//   direccion: '',
//   dias_credito: '30',
//   limite_credito: '0',
//   foto_url: '',
//   notas: '',
// }

// function formDesdeCliente(cliente) {
//   if (!cliente) return camposIniciales
//   return {
//     nombre: cliente.nombre ?? '',
//     telefono: cliente.telefono ?? '',
//     direccion: cliente.direccion ?? '',
//     dias_credito: String(cliente.dias_credito ?? 30),
//     limite_credito: String(cliente.limite_credito ?? 0),
//     foto_url: cliente.foto_url ?? '',
//     notas: cliente.notas ?? '',
//   }
// }

// /**
//  * Formulario de alta/edición de cliente.
//  *
//  * - Sin prop `cliente` → modo alta (POST).
//  * - Con prop `cliente` → modo edición (PUT), precarga sus valores.
//  *
//  * `trigger` es el elemento que abre el panel (un botón "Nuevo cliente", un
//  * botón "Editar" por fila, etc.) — así este componente no impone cómo se
//  * dispara, solo qué pasa una vez abierto.
//  */
// export function ClienteFormSheet({ cliente, trigger }) {
//   const esEdicion = Boolean(cliente)
//   const [open, setOpen] = useState(false)
//   const [form, setForm] = useState(() => formDesdeCliente(cliente))
//   const queryClient = useQueryClient()

//   // El reset del formulario se dispara desde eventos concretos (abrir el
//   // panel, o guardar con éxito), no desde un useEffect: evita un render en
//   // cascada innecesario y es más explícito sobre qué causa el reset.
//   function handleOpenChange(nextOpen) {
//     if (nextOpen) {
//       setForm(formDesdeCliente(cliente))
//     }
//     setOpen(nextOpen)
//   }

//   const mutation = useMutation({
//     mutationFn: () => {
//       const payload = {
//         ...form,
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
//     mutation.mutate()
//   }

//   function updateField(field, value) {
//     setForm((prev) => ({ ...prev, [field]: value }))
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
//             <Input
//               id="cli-nombre"
//               required
//               value={form.nombre}
//               onChange={(e) => updateField('nombre', e.target.value)}
//               placeholder="Nombre y apellido"
//             />
//           </div>

//           <div className="flex flex-col gap-1.5">
//             <Label htmlFor="cli-telefono">Teléfono</Label>
//             <Input
//               id="cli-telefono"
//               type="tel"
//               value={form.telefono}
//               onChange={(e) => updateField('telefono', e.target.value)}
//               placeholder="Opcional"
//             />
//           </div>

//           <div className="flex flex-col gap-1.5">
//             <Label htmlFor="cli-direccion">Dirección</Label>
//             <Input
//               id="cli-direccion"
//               value={form.direccion}
//               onChange={(e) => updateField('direccion', e.target.value)}
//               placeholder="Opcional"
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <div className="flex flex-col gap-1.5">
//               <Label htmlFor="cli-dias">Días de crédito</Label>
//               <Input
//                 id="cli-dias"
//                 type="number"
//                 min="0"
//                 inputMode="numeric"
//                 value={form.dias_credito}
//                 onChange={(e) => updateField('dias_credito', e.target.value)}
//               />
//             </div>
//             <div className="flex flex-col gap-1.5">
//               <Label htmlFor="cli-limite">Límite de crédito</Label>
//               <Input
//                 id="cli-limite"
//                 type="number"
//                 min="0"
//                 inputMode="numeric"
//                 value={form.limite_credito}
//                 onChange={(e) => updateField('limite_credito', e.target.value)}
//               />
//               <p className="text-xs text-muted-foreground">0 = sin límite definido</p>
//             </div>
//           </div>

//           <div className="flex flex-col gap-1.5">
//             <Label htmlFor="cli-foto">URL de foto</Label>
//             <Input
//               id="cli-foto"
//               value={form.foto_url}
//               onChange={(e) => updateField('foto_url', e.target.value)}
//               placeholder="Opcional — todavía no hay subida de imagen, solo URL"
//             />
//           </div>

//           <div className="flex flex-col gap-1.5">
//             <Label htmlFor="cli-notas">Notas</Label>
//             <Textarea
//               id="cli-notas"
//               value={form.notas}
//               onChange={(e) => updateField('notas', e.target.value)}
//               placeholder="Opcional"
//             />
//           </div>

//           <Button type="submit" disabled={mutation.isPending} className="mt-2">
//             {mutation.isPending ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear cliente'}
//           </Button>
//         </form>
//       </SheetContent>
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
  telefono: '',
  direccion: '',
  dias_credito: '30',
  limite_credito: '0',
  foto_url: '',
  notas: '',
}

function formDesdeCliente(cliente) {
  if (!cliente) return camposIniciales
  return {
    nombre: cliente.nombre ?? '',
    telefono: cliente.telefono ?? '',
    direccion: cliente.direccion ?? '',
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
        dias_credito: Number(form.dias_credito) || 0,
        limite_credito: Number(form.limite_credito) || 0,
      }
      return esEdicion ? actualizarCliente({ id: cliente.id, ...payload }) : crearCliente(payload)
    },
    onSuccess: () => {
      toast.success(esEdicion ? 'Cliente actualizado' : 'Cliente creado')
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setConfirmOpen(false)
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el cliente'))
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    // En alta se guarda directo. En edición, se intercepta el submit y se pide
    // confirmación antes de disparar la mutación (ver sección 4.2 del contexto).
    if (esEdicion) {
      setConfirmOpen(true)
    } else {
      mutation.mutate()
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{esEdicion ? 'Editar cliente' : 'Nuevo cliente'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cli-nombre">Nombre</Label>
            <Input id="cli-nombre" required value={form.nombre}
              onChange={(e) => updateField('nombre', e.target.value)} placeholder="Nombre y apellido" />
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
              onChange={(e) => updateField('notas', e.target.value)} placeholder="Opcional" />
          </div>
          <Button type="submit" disabled={mutation.isPending} className="mt-2">
            {mutation.isPending ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </form>
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