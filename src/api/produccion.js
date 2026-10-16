import { apiClient } from './client'

/**
 * Registros de producción paginados + resumen del período.
 * Devuelve { registros, total, resumen: [{ producto_id, producto_nombre, fabricado, ajustes_positivos, ajustes_negativos }], totales }
 */
export async function fetchProduccion({ productoId, tipo, desde, hasta, orden, limit, offset } = {}) {
  const { data } = await apiClient.get('/produccion', {
    params: { producto_id: productoId, tipo, desde, hasta, orden, limit, offset },
  })
  return data
}

/** payload: { producto_id, tipo: 'fabricacion' | 'ajuste_positivo' | 'ajuste_negativo', cantidad, fecha?, notas? } */
export async function registrarProduccion(payload) {
  const { data } = await apiClient.post('/produccion', payload)
  return data
}