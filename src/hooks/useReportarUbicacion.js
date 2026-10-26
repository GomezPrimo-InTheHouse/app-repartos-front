import { useCallback, useEffect, useRef, useState } from 'react'
import { enviarMiUbicacion } from '@/api/geolocalizacion'
import { useAuth } from '@/hooks/useAuth'
import { escribirLocal, geolocalizacionDisponible, leerLocal, obtenerPosicionActual } from '@/lib/geolocalizacion'

const INTERVALO_MINIMO_MS = 2 * 60 * 1000 // como mucho un envío cada 2 minutos
const DIAS_PARA_REPREGUNTAR = 7

// Respuesta guardada al aviso: 'aceptado', o null si nunca respondió o si el "Ahora no" ya venció.
function leerRespuesta(clave) {
  if (!clave) return null
  const valor = leerLocal(clave)
  if (valor?.startsWith('rechazado:')) {
    const fecha = Number(valor.split(':')[1])
    if (Date.now() - fecha > DIAS_PARA_REPREGUNTAR * 24 * 3600 * 1000) return null
  }
  return valor
}

/**
 * Envía la ubicación del usuario al abrir la app y cada vez que vuelve a ella (pestaña visible),
 * solo si su empresa tiene Geolocalización activa. Nada en segundo plano.
 *
 * Antes del primer envío se muestra un aviso explicando qué se comparte (Ley 25.326):
 * `necesitaAviso` indica que hay que mostrarlo; `aceptar` / `rechazar` guardan la respuesta
 * en este dispositivo. Si rechaza, se le vuelve a preguntar a los 7 días.
 */
export function useReportarUbicacion() {
  const { user, isSuperAdmin } = useAuth()
  const activo = Boolean(user?.usaGeolocalizacion) && !isSuperAdmin && geolocalizacionDisponible()
  const claveAviso = user ? `cuaderno.ubicacion.aviso.${user.id}` : null
  const claveUltimo = user ? `cuaderno.ubicacion.ultimo.${user.id}` : null

  const [respuesta, setRespuesta] = useState(() => leerRespuesta(claveAviso))
  const enviando = useRef(false)

  // Si cambia el usuario (logout / login con otro), se relee su respuesta.
  const [usuarioAnterior, setUsuarioAnterior] = useState(claveAviso)
  if (claveAviso !== usuarioAnterior) {
    setUsuarioAnterior(claveAviso)
    setRespuesta(leerRespuesta(claveAviso))
  }

  const acepto = respuesta === 'aceptado'
  const necesitaAviso = activo && !respuesta

  const enviar = useCallback(async () => {
    if (!activo || !acepto || enviando.current) return
    if (document.visibilityState !== 'visible') return
    const ultimo = Number(leerLocal(claveUltimo) ?? 0)
    if (Date.now() - ultimo < INTERVALO_MINIMO_MS) return

    enviando.current = true
    try {
      const pos = await obtenerPosicionActual({ maximumAge: 60000 })
      await enviarMiUbicacion(pos)
      escribirLocal(claveUltimo, String(Date.now()))
    } catch {
      // Sin permiso, sin señal o sin conexión: se reintenta la próxima vez que vuelva a la app.
    } finally {
      enviando.current = false
    }
  }, [activo, acepto, claveUltimo])

  useEffect(() => {
    if (!activo || !acepto) return
    enviar()
    const alVolver = () => {
      if (document.visibilityState === 'visible') enviar()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
  }, [activo, acepto, enviar])

  const aceptar = useCallback(() => {
    escribirLocal(claveAviso, 'aceptado')
    setRespuesta('aceptado')
  }, [claveAviso])

  const rechazar = useCallback(() => {
    const valor = `rechazado:${Date.now()}`
    escribirLocal(claveAviso, valor)
    setRespuesta(valor)
  }, [claveAviso])

  return { necesitaAviso, aceptar, rechazar }
}