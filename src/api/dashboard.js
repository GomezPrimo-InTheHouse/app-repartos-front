import { apiClient } from './client'

export async function fetchResumen() {
  const { data } = await apiClient.get('/dashboard/resumen')
  return data
}

export async function fetchProductosMasVendidos(params = {}) {
  const { data } = await apiClient.get('/dashboard/productos-mas-vendidos', { params })
  return data.productos
}

export async function fetchClientesComprometidos(params = {}) {
  const { data } = await apiClient.get('/dashboard/clientes-comprometidos', { params })
  return data.clientes
}
