import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest } from '@/api/auth'
import { SESSION_EXPIRED_EVENT } from '@/api/client'
import { AuthContext } from './auth-context'

const ME_QUERY_KEY = ['auth', 'me']

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()

  // Fuente de verdad de la sesión: no hay forma de "leer" la cookie httpOnly
  // desde JS, así que siempre le preguntamos al backend quién está logueado.
  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (user) => {
      queryClient.setQueryData(ME_QUERY_KEY, user)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      // Limpiamos toda la cache de queries, no solo la de sesión: al cerrar
      // sesión no queremos que quede dando vueltas data del negocio anterior
      // (por si en el futuro se soporta más de un usuario en el mismo navegador).
      queryClient.clear()
    },
  })

  // Si cualquier request de la app devuelve 401 "en caliente" (sesión vencida
  // mientras se estaba usando la app), lo tratamos igual que un logout.
  useEffect(() => {
    function handleSessionExpired() {
      queryClient.setQueryData(ME_QUERY_KEY, null)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [queryClient])

  const authError = meQuery.error
  const authErrorStatus = authError?.response?.status
  const authErrorMessage = authError?.response?.data?.error ?? ''

  // El backend usa 403 en /auth/me para dos casos distintos y hay que
  // diferenciarlos por el mensaje, no alcanza con el status code:
  // - "Usuario sin negocio asignado": admin/vendedor con propietario_id nulo (dato mal cargado)
  // - "Usuario inactivo o sin perfil asociado": el empleado fue desactivado por su admin
  const sinNegocioAsignado =
    authErrorStatus === 403 && authErrorMessage.toLowerCase().includes('sin negocio')
  const usuarioInactivo =
    authErrorStatus === 403 && authErrorMessage.toLowerCase().includes('inactivo')

  const user = meQuery.data ?? null
  const rol = user?.rol ?? null

  const value = {
    user,
    isLoadingSession: meQuery.isLoading,
    isAuthenticated: Boolean(user),
    sinNegocioAsignado,
    usuarioInactivo,
    // Flags de rol: evitan repetir `user?.rol === '...'` en cada componente.
    // Un super_admin nunca tiene propietarioId (es intencional, no un error).
    rol,
    isSuperAdmin: rol === 'super_admin',
    isAdmin: rol === 'admin',
    isVendedor: rol === 'vendedor',
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutateAsync,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}