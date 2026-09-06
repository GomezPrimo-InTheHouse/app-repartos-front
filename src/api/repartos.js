import { apiClient } from './client'

/**
 * Normaliza cantidad_estimada/cantidad_real, que llegan como string (u
 * ocasionalmente null en cantidad_real todavía no cargada).
 */
function normalizarProductoItem(producto) {
  return {
    ...producto,
    cantidad_estimada:
      producto.cantidad_estimada !== null && producto.cantidad_estimada !== undefined
        ? Number(producto.cantidad_estimada)
        : null,
    cantidad_real:
      producto.cantidad_real !== null && producto.cantidad_real !== undefined
        ? Number(producto.cantidad_real)
        : null,
  }
}

function normalizarItemLista(item) {
  return {
    ...item,
    productos: item.productos?.map(normalizarProductoItem) ?? [],
  }
}

function normalizarLista(lista) {
  return {
    ...lista,
    items: lista.items?.map(normalizarItemLista),
  }
}

function normalizarEjecucion(ejecucion) {
  return {
    ...ejecucion,
    items: ejecucion.items?.map(normalizarItemLista),
  }
}

// --- A. Plantillas (listas) ---

export async function fetchListas({ tipo, activa } = {}) {
  const { data } = await apiClient.get('/repartos/listas', { params: { tipo, activa } })
  return data.listas
}

export async function fetchLista(id) {
  const { data } = await apiClient.get(`/repartos/listas/${id}`)
  const lista = data.lista ?? data
  return normalizarLista(lista)
}

/**
 * payload: { nombre, tipo, dia_semana?, fecha?, items? }
 * items (opcional): [{ cliente_id, orden, productos: [{ producto_id, cantidad_estimada }] }]
 */
export async function crearLista(payload) {
  const { data } = await apiClient.post('/repartos/listas', payload)
  const lista = data.lista ?? data
  return normalizarLista(lista)
}

export async function actualizarLista({ id, ...payload }) {
  const { data } = await apiClient.put(`/repartos/listas/${id}`, payload)
  const lista = data.lista ?? data
  return normalizarLista(lista)
}

export async function eliminarLista(id) {
  await apiClient.delete(`/repartos/listas/${id}`)
}

export async function agregarItemLista({ listaId, clienteId, orden, productos }) {
  const { data } = await apiClient.post(`/repartos/listas/${listaId}/items`, {
    cliente_id: clienteId,
    orden,
    productos,
  })
  return data
}

export async function actualizarItemLista({ listaId, itemId, productos }) {
  const { data } = await apiClient.put(`/repartos/listas/${listaId}/items/${itemId}`, { productos })
  return data
}

export async function eliminarItemLista({ listaId, itemId }) {
  await apiClient.delete(`/repartos/listas/${listaId}/items/${itemId}`)
}

// --- B. Reparto del día ---

/**
 * Genera (si no existe) y devuelve las ejecuciones del día. Idempotente:
 * se puede llamar repetidas veces sin duplicar nada.
 */
export async function fetchRepartoHoy(fecha) {
  const { data } = await apiClient.get('/repartos/hoy', { params: { fecha } })
  return {
    fecha: data.fecha,
    ejecuciones: data.ejecuciones.map(normalizarEjecucion),
  }
}

// --- C. Historial y carga de datos reales ---

export async function fetchEjecuciones({ desde, hasta, listaRepartoId } = {}) {
  const { data } = await apiClient.get('/repartos/ejecuciones', {
    params: { desde, hasta, lista_reparto_id: listaRepartoId },
  })
  return data.ejecuciones
}

export async function fetchEjecucion(id) {
  const { data } = await apiClient.get(`/repartos/ejecuciones/${id}`)
  const ejecucion = data.ejecucion ?? data
  return normalizarEjecucion(ejecucion)
}

/**
 * Carga lo realmente despachado para un cliente dentro de una ejecución.
 * `visitado` y `productos` son ambos opcionales — se puede mandar solo uno.
 * productos: [{ producto_id, cantidad_real }]
 */
export async function actualizarItemEjecucion({ ejecucionId, itemId, visitado, productos }) {
  const { data } = await apiClient.put(
    `/repartos/ejecuciones/${ejecucionId}/items/${itemId}`,
    { visitado, productos }
  )
  return normalizarItemLista(data)
}

export async function completarEjecucion(id) {
  const { data } = await apiClient.post(`/repartos/ejecuciones/${id}/completar`)
  return data
}