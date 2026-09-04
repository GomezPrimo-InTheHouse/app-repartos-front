import { apiClient } from './client'

export async function fetchClientes({
  busqueda,
  activo,
  ordenarPor,
  orden,
  soloDeudores,
  saldoMinimo,
} = {}) {
  const { data } = await apiClient.get('/clientes', {
    params: { busqueda, activo, ordenarPor, orden, soloDeudores, saldoMinimo },
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

/**
 * Importación masiva de clientes desde un archivo Excel (.xlsx / .xls).
 * El backend hace todo el trabajo (parseo + mapeo de columnas vía IA) —
 * el frontend solo manda el archivo y muestra el resultado.
 *
 * Devuelve { totalFilasLeidas, creados, omitidos }.
 *
 * Timeout extendido a 2 minutos: el procesamiento con IA puede tardar
 * bastante más que una request normal, sobre todo con archivos grandes
 * (hasta 200 filas según el límite del backend).
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

/**
 * Saldo de envases retornables en poder del cliente, agrupado por producto.
 * Solo devuelve productos con maneja_envase=true que tengan algún movimiento.
 * `saldo` ya viene como number, casteado por el backend (a diferencia de
 * otros campos numéricos de la app).
 */
export async function fetchEnvasesCliente(clienteId) {
  const { data } = await apiClient.get(`/clientes/${clienteId}/envases`)
  return data.envases ?? data
}

/**
 * Ajuste manual de envases (fuera del flujo de un despacho puntual).
 * delta puede ser positivo (suma envases en poder del cliente) o negativo
 * (resta), nunca 0 — eso lo valida el backend con 400.
 * Devuelve el nuevo saldo de ese producto para ese cliente.
 */
export async function ajustarEnvaseCliente({ clienteId, productoId, delta, motivo }) {
  const { data } = await apiClient.post(`/clientes/${clienteId}/envases/ajuste`, {
    producto_id: productoId,
    delta,
    motivo,
  })
  return data
}