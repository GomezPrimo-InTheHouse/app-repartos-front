import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { actualizarTelefonoCliente } from '@/api/clientes'
import { getApiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  armarMensaje, cambiarDia, formatearTelefonoAR, guardarPlantilla, leerPlantilla, linkWhatsApp,
  mensajeAPlantilla, normalizarTelefonoAR, restablecerPlantilla, PLANTILLA_POR_DEFECTO,
} from '@/lib/whatsapp'

/**
 * Aviso por WhatsApp a un cliente de la lista: "hoy / mañana pasamos con el reparto".
 * No cuesta nada: abre WhatsApp con el mensaje escrito y la persona toca Enviar.
 * Si el cliente no tiene teléfono, se pide acá y queda guardado como su teléfono.
 *
 * cliente: { id, nombre, telefono }. diaInicial: 'hoy' | 'mañana'.
 */
export function AvisoWhatsAppDialog({ cliente, diaInicial = 'mañana', open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        {cliente && (
          <Contenido key={cliente.id} cliente={cliente} diaInicial={diaInicial} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Contenido({ cliente, diaInicial, onClose }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const empresa = user?.empresaNombre ?? ''
  const telefonoGuardado = cliente.telefono?.trim() ?? ''

  const [telefono, setTelefono] = useState(telefonoGuardado)
  const [dia, setDia] = useState(diaInicial)
  const [mensaje, setMensaje] = useState(() => armarMensaje(leerPlantilla(), { nombre: cliente.nombre, empresa, dia: diaInicial }))

  const normalizado = normalizarTelefonoAR(telefono)
  const telefonoCambio = telefono.trim() !== telefonoGuardado
  const datosMensaje = { nombre: cliente.nombre, empresa, dia }

  const guardarTelefono = useMutation({
    mutationFn: () => actualizarTelefonoCliente({ clienteId: cliente.id, telefono: telefono.trim() }),
    onSuccess: () => {
      toast.success(`Teléfono guardado en los datos de ${cliente.nombre}`)
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo guardar el teléfono del cliente')),
  })

  function elegirDia(nuevo) {
    setMensaje((actual) => cambiarDia(actual, dia, nuevo))
    setDia(nuevo)
  }

  function guardarComoPredeterminado() {
    guardarPlantilla(mensajeAPlantilla(mensaje, datosMensaje))
    toast.success('Mensaje guardado como predeterminado en este dispositivo')
  }

  function volverAlOriginal() {
    restablecerPlantilla()
    setMensaje(armarMensaje(PLANTILLA_POR_DEFECTO, datosMensaje))
  }

  function enviar() {
    if (!normalizado) {
      toast.error('Revisá el teléfono: código de área sin 0 y número sin 15, por ejemplo 353 4123456')
      return
    }
    if (!mensaje.trim()) {
      toast.error('Escribí un mensaje')
      return
    }
    // Se abre WhatsApp en el mismo toque (si se espera al guardado, el navegador puede bloquear la ventana)
    window.open(linkWhatsApp(normalizado, mensaje.trim()), '_blank', 'noopener')
    if (telefonoCambio) guardarTelefono.mutate()
    onClose()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Avisar a {cliente.nombre}</DialogTitle>
        <DialogDescription>
          Se abre WhatsApp con el mensaje escrito. Revisalo y tocá Enviar desde tu celular o computadora.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="aviso-telefono">WhatsApp del cliente</Label>
        <Input
          id="aviso-telefono"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Ej: 353 4123456"
          autoFocus={!telefonoGuardado}
        />
        {!telefonoGuardado && (
          <p className="text-xs text-warning">
            Este cliente no tiene teléfono cargado. El número que escribas queda guardado en sus datos.
          </p>
        )}
        {telefonoGuardado && telefonoCambio && (
          <p className="text-xs text-muted-foreground">Al enviar, este número reemplaza al que tenía cargado.</p>
        )}
        {telefono.trim() && (
          <p className={cn('text-xs', normalizado ? 'text-muted-foreground' : 'text-destructive')}>
            {normalizado
              ? `Se envía a ${formatearTelefonoAR(normalizado)}`
              : 'No parece un número válido: código de área sin 0 y número sin 15.'}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>¿Cuándo pasa el reparto?</Label>
        <div className="grid grid-cols-2 gap-2">
          {['hoy', 'mañana'].map((opcion) => (
            <Button
              key={opcion}
              type="button"
              variant={dia === opcion ? 'default' : 'outline'}
              onClick={() => elegirDia(opcion)}
              aria-pressed={dia === opcion}
            >
              {opcion === 'hoy' ? 'Hoy' : 'Mañana'}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="aviso-mensaje">Mensaje</Label>
        <Textarea id="aviso-mensaje" rows={5} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <button type="button" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={guardarComoPredeterminado}>
            Usar este texto para todos los avisos
          </button>
          <button type="button" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={volverAlOriginal}>
            Volver al mensaje original
          </button>
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="button" onClick={enviar} disabled={!normalizado || !mensaje.trim()}>
          <MessageCircle className="size-4" />
          Abrir WhatsApp
        </Button>
      </DialogFooter>
    </>
  )
}