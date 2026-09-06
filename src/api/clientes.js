import { apiClient } from './client'

// --- CRUD básico de clientes ---

export async function fetchClientes({
  busqueda,
  activo,
  ordenarPor,
  orden,
  soloDeudores,
  saldoMinimo,
  barrio,
} = {}) {
  const { data } = await apiClient.get('/clientes', {
    params: { busqueda, activo, ordenarPor, orden, soloDeudores, saldoMinimo, barrio },
  })
  return data.clientes ?? data
}

export async function fetchCliente(id) {
  const { data } = await apiClient.get(`/clientes/${id}`)
  return data.cliente ?? data
}

export async function crearCliente(payload) {
  const { data } = await apiClient.post('/clientes', payload)
  return data.cliente ?? data
}

export async function actualizarCliente({ id, ...payload }) {
  const { data } = await apiClient.put(`/clientes/${id}`, payload)
  return data.cliente ?? data
}

export async function eliminarCliente(id) {
  await apiClient.delete(`/clientes/${id}`)
}

// --- Importación masiva ---

/**
 * Importación masiva de clientes desde Excel (.xlsx / .xls).
 *
 * v2: el backend ya no siempre usa IA — si detecta un encabezado
 * reconocible, procesa determinísticamente (rápido, exacto, sin variación
 * entre corridas). Solo cae a IA si el formato es atípico. También divide
 * automáticamente filas con más de un cliente pegado en la misma celda
 * (ej. "PIVIERO / Moroncini Pablo"), y omite explícitamente filas sin
 * dirección o ambiguas, en vez de adivinar o perderlas silenciosamente.
 *
 * Devuelve { totalFilasLeidas, metodoExtraccion, creados, omitidos, filasDivididas }.
 *
 * Timeout extendido a 2 minutos: sigue vigente para el caso en que el
 * backend recurra a IA como respaldo.
 */
export async function importarClientesExcel(archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)

  const { data } = await apiClient.post('/clientes/importar-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
  return data
}

// --- Envases retornables ---

export async function fetchEnvasesCliente(clienteId) {
  const { data } = await apiClient.get(`/clientes/${clienteId}/envases`)
  return data.envases ?? data
}

export async function ajustarEnvaseCliente({ clienteId, productoId, delta, motivo }) {
  const { data } = await apiClient.post(`/clientes/${clienteId}/envases/ajuste`, {
    producto_id: productoId,
    delta,
    motivo,
  })
  return data
}