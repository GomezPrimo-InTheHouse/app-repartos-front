import { apiClient } from './client'

export async function fetchEmpleados() {
  const { data } = await apiClient.get('/empleados')
  return data.empleados
}

export async function crearEmpleado({ email, password, nombreCompleto, rol }) {
  const { data } = await apiClient.post('/empleados', { email, password, nombreCompleto, rol })
  return data.empleado
}

export async function actualizarEstadoEmpleado({ id, activo }) {
  const { data } = await apiClient.put(`/empleados/${id}/estado`, { activo })
  return data.empleado
}

export async function resetearPasswordEmpleado({ id, nuevaPassword }) {
  const { data } = await apiClient.post(`/empleados/${id}/resetear-password`, { nuevaPassword })
  return data
}