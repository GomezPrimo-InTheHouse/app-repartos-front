import { apiClient } from './client'

// --- CRUD básico de clientes ---

/**
 * Listado de clientes SIN paginar — devuelve el array directo.
 * Usado en selectores (carrito de despacho, alta de pago, listas de
 * reparto, etc.) donde se necesitan todos los clientes que matcheen el
 * filtro, no una página puntual. Si se le pasan limit/offset igual
 * funciona, pero la mayoría de los usos actuales no los mandan.
 */
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

/**
 * Listado de clientes PAGINADO — devuelve { clientes, total }.
 * Usado exclusivamente en ClientesPage (el listado principal), donde con
 * 1000+ clientes hace falta paginación real de servidor. `total` es la
 * cantidad de filas que matchean el filtro, sin paginar, para armar los
 * controles de "página X de Y".
 */
export async function fetchClientesPaginado({
  busqueda,
  activo,
  ordenarPor,
  orden,
  soloDeudores,
  saldoMinimo,
  barrio,
  limit,
  offset,
} = {}) {
  const { data } = await apiClient.get('/clientes', {
    params: { busqueda, activo, ordenarPor, orden, soloDeudores, saldoMinimo, barrio, limit, offset },
  })
  return { clientes: data.clientes, total: data.total }
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

// --- Importación masiva (en 2 pasos: previsualizar → confirmar) ---

/**
 * Paso 1: sube el archivo y trae los candidatos detectados, SIN crear
 * nada en la base todavía. El usuario revisa/destilda antes de confirmar.
 * Devuelve { totalFilasLeidas, metodoExtraccion, candidatos, omitidos, filasDivididas }.
 */
export async function previsualizarImportacionExcel(archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)

  const { data } = await apiClient.post('/clientes/importar-excel/previsualizar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
  return data
}

/**
 * Paso 2: crea en la base solo los candidatos que el usuario dejó
 * tildados (y con las ediciones manuales que haya hecho, si las hizo).
 * `id` de cada candidato (el que vino de previsualizar) es opcional acá,
 * se puede mandar igual sin problema — el backend lo ignora.
 * Devuelve { creados, omitidos }.
 */
export async function confirmarImportacionExcel(candidatos) {
  const { data } = await apiClient.post('/clientes/importar-excel/confirmar', { candidatos })
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