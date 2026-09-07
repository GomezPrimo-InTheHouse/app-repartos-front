import { apiClient } from './client'

/** Normaliza un producto real despachado (ya no hay estimado/real separados). */
function normalizarProductoReal(producto) {
  return {
    ...producto,
    cantidad: Number(producto.cantidad),
  }
}

function normalizarItemEjecucion(item) {
  return {
    ...item,
    productos: (item.productos ?? []).map(normalizarProductoReal),
  }
}

function normalizarEjecucion(ejecucion) {
  return {
    ...ejecucion,
    items: ejecucion.items?.map(normalizarItemEjecucion),
  }
}

// --- A. Plantillas (listas) — solo clientes + orden, sin productos ---

export async function fetchListas({ tipo, activa } = {}) {
  const { data } = await apiClient.get('/repartos/listas', { params: { tipo, activa } })
  return data.listas
}

/** Detalle de plantilla: items son solo { id, cliente_id, cliente_nombre, orden }. */
export async function fetchLista(id) {
  const { data } = await apiClient.get(`/repartos/listas/${id}`)
  return data.lista ?? data
}

/** payload: { nombre, tipo, dia_semana?, fecha?, items?: [{ cliente_id, orden }] } */
export async function crearLista(payload) {
  const { data } = await apiClient.post('/repartos/listas', payload)
  return data.lista ?? data
}

export async function actualizarLista({ id, ...payload }) {
  const { data } = await apiClient.put(`/repartos/listas/${id}`, payload)
  return data.lista ?? data
}

export async function eliminarLista(id) {
  await apiClient.delete(`/repartos/listas/${id}`)
}

export async function agregarItemLista({ listaId, clienteId, orden }) {
  const { data } = await apiClient.post(`/repartos/listas/${listaId}/items`, {
    cliente_id: clienteId,
    orden,
  })
  return data
}

export async function eliminarItemLista({ listaId, itemId }) {
  await apiClient.delete(`/repartos/listas/${listaId}/items/${itemId}`)
}

// --- B. Reparto del día ---

/**
 * Genera (si no existe) y devuelve las ejecuciones del día. `productos` de
 * cada cliente ahora es lo REALMENTE despachado ese día (calculado por el
 * backend desde despachos reales, no un valor cargado a mano). `visitado`
 * combina despacho real O marca manual.
 */
export async function fetchRepartoHoy(fecha) {
  const { data } = await apiClient.get('/repartos/hoy', { params: { fecha } })
  return {
    fecha: data.fecha,
    ejecuciones: data.ejecuciones.map(normalizarEjecucion),
  }
}

// --- C. Historial ---

export async function fetchEjecuciones({ desde, hasta, listaRepartoId } = {}) {
  const { data } = await apiClient.get('/repartos/ejecuciones', {
    params: { desde, hasta, lista_reparto_id: listaRepartoId },
  })
  return data.ejecuciones
}

export async function fetchEjecucion(id) {
  const { data } = await apiClient.get(`/repartos/ejecuciones/${id}`)
  return normalizarEjecucion(data.ejecucion ?? data)
}

/**
 * Marca manualmente visitado/no visitado (caso "visitó pero no compró").
 * Ya no acepta `productos` — la cantidad real se deriva sola de los
 * despachos reales del día, no se carga a mano.
 */
export async function actualizarItemEjecucion({ ejecucionId, itemId, visitado }) {
  const { data } = await apiClient.put(`/repartos/ejecuciones/${ejecucionId}/items/${itemId}`, {
    visitado,
  })
  return normalizarItemEjecucion(data)
}

export async function completarEjecucion(id) {
  const { data } = await apiClient.post(`/repartos/ejecuciones/${id}/completar`)
  return data
}