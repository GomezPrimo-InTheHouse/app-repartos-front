import axios from 'axios'

/**
 * Cliente HTTP central de la app.
 *
 * - `baseURL`: en producción usamos la ruta relativa `/api`, que Vercel
 *   reescribe hacia el backend real de Render (ver vercel.json en la raíz
 *   del proyecto). Esto hace que, desde la perspectiva del navegador, el
 *   frontend y el backend sean el mismo origen — evita el bloqueo de
 *   cookies cross-domain que aplica Safari/iOS de forma más agresiva que
 *   otros navegadores, incluso con `SameSite=None; Secure` bien configurado.
 *   En desarrollo local seguimos usando la URL completa de VITE_API_URL
 *   (http://localhost:4000/api), porque ahí no hay proxy de Vercel.
 * - `withCredentials: true` es obligatorio en TODAS las requests: la sesión
 *   viaja como cookie httpOnly, no como token. Sin esto el backend nunca ve
 *   la cookie y todo responde 401.
 * - El interceptor de 401 dispara un evento global en vez de redirigir acá
 *   mismo, para no acoplar esta capa a react-router. Quien escucha ese
 *   evento (AuthProvider) decide qué hacer con la sesión y la navegación.
 */
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

    // No disparamos el evento si el 401 viene del propio /auth/me o /auth/login:
    // ahí un 401 es una respuesta esperada (todavía no hay sesión / credenciales
    // inválidas), no una sesión que "se venció" en medio del uso de la app.
    const esRutaDeAuth = url.includes('/auth/me') || url.includes('/auth/login')

    if (status === 401 && !esRutaDeAuth) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    }

    return Promise.reject(error)
  }
)

/**
 * Extrae un mensaje de error legible de una respuesta de la API.
 * El backend siempre responde `{ error: "mensaje" }` en los casos de error.
 */
export function getApiErrorMessage(error, fallback = 'Ocurrió un error inesperado') {
  return error?.response?.data?.error ?? fallback
}