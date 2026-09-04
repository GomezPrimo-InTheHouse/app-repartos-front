import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute() {
  const { isAuthenticated, isLoadingSession, sinNegocioAsignado, usuarioInactivo } = useAuth()

  if (isLoadingSession) {
    return <SessionCheckSplash />
  }

  if (sinNegocioAsignado) {
    return <SinNegocioAsignado />
  }

  if (usuarioInactivo) {
    return <UsuarioInactivo />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function SessionCheckSplash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <p className="font-display text-lg text-muted-foreground">Verificando sesión…</p>
    </div>
  )
}

function SinNegocioAsignado() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background px-6 text-center">
      <p className="font-display text-xl font-semibold text-destructive">
        Tu usuario no tiene un negocio asignado
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Esto no debería pasar en uso normal. Contactá a quien administra el sistema para que revise
        la configuración de tu cuenta.
      </p>
    </div>
  )
}

function UsuarioInactivo() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background px-6 text-center">
      <p className="font-display text-xl font-semibold text-destructive">Tu cuenta está desactivada</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Un administrador de tu negocio dio de baja tu acceso. Si creés que es un error, contactalo
        directamente para que reactive tu cuenta.
      </p>
    </div>
  )
}