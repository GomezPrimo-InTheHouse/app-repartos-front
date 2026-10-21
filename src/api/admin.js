// import { apiClient } from './client'

// export async function fetchUsuarios() {
//   const { data } = await apiClient.get('/admin/usuarios')
//   return data.usuarios
// }

// export async function fetchPropietarios() {
//   const { data } = await apiClient.get('/admin/propietarios')
//   return data.propietarios
// }

// export async function resetearPasswordAdmin({ email, nuevaPassword }) {
//   const { data } = await apiClient.post('/admin/resetear-password', { email, nuevaPassword })
//   return data
// }

// /** Activa/desactiva módulos opcionales de una empresa. features: { usa_produccion?: boolean } */
// export async function actualizarFeaturesPropietario({ id, ...features }) {
//   const { data } = await apiClient.patch(`/admin/propietarios/${id}/features`, features)
//   return data.propietario
// }

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

/** Activa/desactiva módulos opcionales de una empresa. features: { usa_produccion?: boolean } */
export async function actualizarFeaturesPropietario({ id, ...features }) {
  const { data } = await apiClient.patch(`/admin/propietarios/${id}/features`, features)
  return data.propietario
}

/** Alta de empresa con su administrador inicial. payload: { empresa: {...}, admin: { nombreCompleto, email, password } } */
export async function crearPropietario(payload) {
  const { data } = await apiClient.post('/admin/propietarios', payload)
  return data.propietario
}

/** Edita los datos de la empresa (no toca usuarios ni módulos). */
export async function actualizarPropietario({ id, ...empresa }) {
  const { data } = await apiClient.put(`/admin/propietarios/${id}`, empresa)
  return data.propietario
}

/** Baja o reactivación lógica: una empresa inactiva no puede ingresar, pero conserva sus datos. */
export async function actualizarEstadoPropietario({ id, activo }) {
  const { data } = await apiClient.patch(`/admin/propietarios/${id}/estado`, { activo })
  return data.propietario
}