import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const SESSION_EXPIRED_EVENT = 'auth:session-expired'

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const esRutaDeAuth = url.includes('/auth/me') || url.includes('/auth/login')

    if (status === 401 && !esRutaDeAuth) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    }

    return Promise.reject(error)
  }
)

export function getApiErrorMessage(error, fallback = 'Ocurrió un error inesperado') {
  return error?.response?.data?.error ?? fallback
}