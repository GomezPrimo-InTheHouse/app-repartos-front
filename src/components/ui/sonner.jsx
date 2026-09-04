import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            'bg-card! border! border-border! text-foreground! font-sans! shadow-md! rounded-lg!',
          title: 'font-medium!',
          description: 'text-muted-foreground!',
          actionButton: 'bg-primary! text-primary-foreground!',
          cancelButton: 'bg-secondary! text-secondary-foreground!',
          error: 'border-destructive/40! text-destructive!',
          success: 'border-success/40! text-success!',
        },
      }}
    />
  )
}
