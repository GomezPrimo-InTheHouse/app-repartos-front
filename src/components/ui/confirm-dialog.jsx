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
    // Se cierra siempre al confirmar, igual que "Cancelar" — sin esto,
    // el dialog quedaba abierto después de guardar salvo que algo externo
    // lo cerrara.
    onOpenChange?.(false)
  }

  function handleCancel() {
    onOpenChange?.(false)
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
            onClick={handleCancel}
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