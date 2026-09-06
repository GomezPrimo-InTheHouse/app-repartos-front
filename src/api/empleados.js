import { apiClient } from './client'

export async function fetchEmpleados() {
  const { data } = await apiClient.get('/empleados')
  return data.empleados
}

export async function fetchModulosDisponibles() {
  const { data } = await apiClient.get('/empleados/modulos-disponibles')
  return data.modulos
}

export async function crearEmpleado({ email, password, nombreCompleto, rol, permisos }) {
  const { data } = await apiClient.post('/empleados', {
    email,
    password,
    nombreCompleto,
    rol,
    permisos,
  })
  return data.empleado
}

export async function actualizarEstadoEmpleado({ id, activo }) {
  const { data } = await apiClient.put(`/empleados/${id}/estado`, { activo })
  return data.empleado
}

export async function actualizarPermisosEmpleado({ id, permisos }) {
  const { data } = await apiClient.put(`/empleados/${id}/permisos`, { permisos })
  return data.empleado
}

export async function resetearPasswordEmpleado({ id, nuevaPassword }) {
  const { data } = await apiClient.post(`/empleados/${id}/resetear-password`, { nuevaPassword })
  return data
}