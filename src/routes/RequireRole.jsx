import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getHomeRoute } from '@/lib/navHome'

/**
 * Protege una rama de rutas por rol, además de por sesión (eso ya lo resuelve
 * `ProtectedRoute`, que debe envolver a este componente más arriba en el árbol).
 *
 * Si el usuario no tiene uno de los roles permitidos, lo mandamos a SU home
 * real (calculada según su rol/permisos, ver navHome.js) en vez de un "/"
 * fijo — evita loops para un vendedor sin el permiso "dashboard".
 */
export function RequireRole({ roles }) {
  const { rol, tienePermiso } = useAuth()

  const tieneAcceso = roles.includes(rol)

  if (!tieneAcceso) {
    return <Navigate to={getHomeRoute(rol, tienePermiso)} replace />
  }

  return <Outlet />
}