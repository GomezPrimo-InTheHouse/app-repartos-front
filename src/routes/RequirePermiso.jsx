import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getHomeRoute } from '@/lib/navHome'

/**
 * Bloquea la navegación directa por URL a un módulo que el usuario logueado
 * no tiene habilitado. Redirige a la home REAL del usuario (calculada según
 * sus permisos, ver navHome.js) en vez de un "/" fijo, para evitar loops
 * si el usuario no tiene el permiso "dashboard".
 */
export function RequirePermiso({ permiso }) {
  const { rol, tienePermiso } = useAuth()

  if (!tienePermiso(permiso)) {
    return <Navigate to={getHomeRoute(rol, tienePermiso)} replace />
  }

  return <Outlet />
}