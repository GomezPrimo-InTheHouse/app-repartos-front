import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/**
 * Pantalla para el caso extremo de un vendedor sin ningún módulo habilitado
 * (permisos: []). No debería pasar en uso normal —un admin siempre debería
 * asignar al menos un módulo al crear el empleado—, pero evita que la app
 * quede en un estado roto o en loop de redirects si llega a ocurrir.
 */
export function SinAccesoPage() {
  const { logout } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <p className="font-display text-xl font-semibold text-destructive">
        Todavía no tenés ningún módulo habilitado
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Un administrador de tu negocio tiene que asignarte acceso a al menos un módulo para que
        puedas usar el sistema. Contactalo para que lo revise.
      </p>
      <button
        onClick={() => logout()}
        className="mt-2 flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="size-4" />
        Cerrar sesión
      </button>
    </div>
  )
}