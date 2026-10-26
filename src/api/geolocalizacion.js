import { apiClient } from './client'

/** Clientes activos con ubicación y saldo. Con listaId: solo los de esa lista, en orden de visita. */
export async function fetchClientesGeo({ listaId } = {}) {
  const { data } = await apiClient.get('/geolocalizacion/clientes', {
    params: { lista_id: listaId || undefined },
  })
  return data // { listas, clientes }
}

/** Guarda la ubicación de un cliente. latitud/longitud en null la quitan. origen: 'manual' | 'gps' */
export async function guardarUbicacionCliente({ clienteId, latitud, longitud, origen }) {
  const { data } = await apiClient.put(`/geolocalizacion/clientes/${clienteId}/ubicacion`, {
    latitud,
    longitud,
    origen,
  })
  return data.cliente
}

/** Envía la posición actual del usuario logueado (se guarda solo la última). */
export async function enviarMiUbicacion({ latitud, longitud, precision }) {
  await apiClient.post('/geolocalizacion/mi-ubicacion', { latitud, longitud, precision })
}

/** Empleados activos con su última ubicación conocida (solo admin). */
export async function fetchRepartidoresGeo() {
  const { data } = await apiClient.get('/geolocalizacion/repartidores')
  return data.repartidores
}