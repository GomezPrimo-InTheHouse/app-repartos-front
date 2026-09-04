import { apiClient } from './client'

export async function fetchUsuarios() {
  const { data } = await apiClient.get('/admin/usuarios')
  return data.usuarios
}

export async function fetchPropietarios() {
  const { data } = await apiClient.get('/admin/propietarios')
  return data.propietarios
}

export async function resetearPasswordAdmin({ email, nuevaPassword }) {
  const { data } = await apiClient.post('/admin/resetear-password', { email, nuevaPassword })
  return data
}