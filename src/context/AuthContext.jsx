import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest } from '@/api/auth'
import { SESSION_EXPIRED_EVENT } from '@/api/client'
import { AuthContext } from './auth-context'

const ME_QUERY_KEY = ['auth', 'me']

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()

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
      queryClient.clear()
    },
  })

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

  const sinNegocioAsignado =
    authErrorStatus === 403 && authErrorMessage.toLowerCase().includes('sin negocio')
  const usuarioInactivo =
    authErrorStatus === 403 && authErrorMessage.toLowerCase().includes('inactivo')

  const user = meQuery.data ?? null
  const rol = user?.rol ?? null
  const isAdmin = rol === 'admin'
  const isSuperAdmin = rol === 'super_admin'

  // Un admin o super_admin siempre tiene acceso a todo, sin importar el
  // array de permisos (el sistema de permisos es exclusivo para vendedor).
  // tienePermiso() es la función que nav-items.js usa para filtrar el menú.
  function tienePermiso(clave) {
    if (isAdmin || isSuperAdmin) return true
    return user?.permisos?.includes(clave) ?? false
  }

  const value = {
    user,
    isLoadingSession: meQuery.isLoading,
    isAuthenticated: Boolean(user),
    sinNegocioAsignado,
    usuarioInactivo,
    rol,
    isSuperAdmin,
    isAdmin,
    isVendedor: rol === 'vendedor',
    tienePermiso,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutateAsync,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}