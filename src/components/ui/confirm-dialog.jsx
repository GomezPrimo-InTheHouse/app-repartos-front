import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/**
 * ConfirmDialog genérico, reutilizable para confirmaciones de edición y eliminación.
 *
 * Dos modos de uso:
 * 1) Con `trigger`: el propio dialog maneja su estado abierto/cerrado (ej. botón "Eliminar").
 * 2) Controlado: se pasan `open` y `onOpenChange` desde afuera, sin `trigger`
 *    (ej. interceptar el submit de un form para pedir confirmación antes de guardar).
 *
 * En ambos modos, `onConfirm` puede ser async — mientras esté pendiente, el botón
 * de confirmar muestra `confirmingLabel` y se deshabilita junto con "Cancelar".
 */
export function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  confirmingLabel = 'Guardando…',
  cancelLabel = 'Cancelar',
  variant = 'default',
  isPending = false,
  onConfirm,
}) {
  async function handleConfirm() {
    await onConfirm?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => onOpenChange?.(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? confirmingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}