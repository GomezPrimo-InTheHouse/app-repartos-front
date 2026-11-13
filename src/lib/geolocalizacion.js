// Utilidades de ubicación compartidas por el mapa, el reparto del día y el envío automático.

/** Centro por defecto del mapa cuando todavía no hay nada ubicado: Villa María, Córdoba. */
export const CENTRO_POR_DEFECTO = [-32.4075, -63.2402]
export const ZOOM_POR_DEFECTO = 13

/** Más viejo que esto, la posición de un repartidor se muestra como desactualizada. */
export const HORAS_UBICACION_VIGENTE = 2

const MENSAJES_ERROR = {
  1: 'No diste permiso para usar la ubicación. Habilitalo en la configuración del navegador.',
  2: 'No se pudo obtener la ubicación. Revisá que el GPS esté prendido.',
  3: 'La ubicación tardó demasiado. Probá de nuevo, mejor al aire libre.',
}

export function geolocalizacionDisponible() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

/**
 * Pide la posición actual al navegador. Resuelve { latitud, longitud, precision } o rechaza con un
 * Error con mensaje en español (y `code` del navegador: 1 permiso, 2 sin señal, 3 timeout).
 */
export function obtenerPosicionActual({ timeout = 15000, maximumAge = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!geolocalizacionDisponible()) {
      reject(Object.assign(new Error('Este navegador no permite obtener la ubicación.'), { code: 0 }))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          precision: pos.coords.accuracy,
        }),
      (err) => reject(Object.assign(new Error(MENSAJES_ERROR[err.code] ?? 'No se pudo obtener la ubicación.'), { code: err.code })),
      { enableHighAccuracy: true, timeout, maximumAge }
    )
  })
}

/** Link para abrir el recorrido hasta un punto en Google Maps (app o web). */
export function linkComoLlegar(latitud, longitud) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`
}

/** "hace 5 min", "hace 2 h", "hace 3 días". */
export function haceCuanto(fecha) {
  if (!fecha) return 'nunca'
  const minutos = Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000))
  if (minutos < 1) return 'recién'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.round(horas / 24)
  return `hace ${dias} día${dias === 1 ? '' : 's'}`
}

export function ubicacionVigente(fecha) {
  if (!fecha) return false
  return Date.now() - new Date(fecha).getTime() < HORAS_UBICACION_VIGENTE * 3600 * 1000
}

// localStorage puede no estar disponible (modo privado, bloqueado): nunca rompe la app.
export function leerLocal(clave) {
  try {
    return window.localStorage.getItem(clave)
  } catch {
    return null
  }
}

export function escribirLocal(clave, valor) {
  try {
    window.localStorage.setItem(clave, valor)
  } catch {
    // sin almacenamiento: se vuelve a preguntar la próxima vez
  }
}