import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/**
 * Protege una rama de rutas por rol, además de por sesión (eso ya lo resuelve
 * `ProtectedRoute`, que debe envolver a este componente más arriba en el árbol).
 *
 * Si el usuario logueado no tiene uno de los roles permitidos, no lo mandamos
 * a una pantalla de "403" genérica: lo redirigimos a la home que le
 * corresponde según SU rol, para que la app se sienta coherente en vez de
 * mostrar un callejón sin salida.
 *
 * Uso:
 *   <Route element={<RequireRole roles={['super_admin']} />}>
 *     <Route path="/admin" element={<AdminUsuariosPage />} />
 *   </Route>
 */
export function RequireRole({ roles }) {
  const { rol, isSuperAdmin } = useAuth()

  const tienePermiso = roles.includes(rol)

  if (!tienePermiso) {
    // Nota: no usamos useNavigate/homeParaRol acá para no crear una dependencia
    // circular de rutas; alcanza con saber si es super_admin o no, ya que hoy
    // solo hay dos "hogares" posibles en la app (/admin y /).
    return <Navigate to={isSuperAdmin ? '/admin' : '/'} replace />
  }

  return <Outlet />
}