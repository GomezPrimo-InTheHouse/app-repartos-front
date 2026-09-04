import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/**
 * Envuelve el contenido de la ruta "/" para desviar a un super_admin antes de
 * que llegue a renderizarse. El dashboard normal asume que hay un negocio
 * asociado (llama a /dashboard/resumen, etc.) y un super_admin no tiene
 * propietarioId — dejarlo pasar rompería esa pantalla con errores confusos.
 *
 * No es un componente de ruta por sí mismo (no usa <Outlet />): envuelve al
 * elemento que normalmente iría en esa ruta.
 *
 * Uso:
 *   <Route path="/" element={<RoleRedirect><DashboardPage /></RoleRedirect>} />
 */
export function RoleRedirect({ children }) {
  const { isSuperAdmin } = useAuth()

  if (isSuperAdmin) {
    return <Navigate to="/admin" replace />
  }

  return children
}