import { apiClient } from '../api/client.js'

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

/**
 * Intenta ubicar a un cliente con la dirección que tiene cargada. El back guarda el pin solo si
 * encuentra la altura exacta y si el cliente todavía no estaba ubicado.
 * Devuelve { estado: 'ubicado' | 'ya_ubicado' | 'sin_direccion' | 'aproximado' | 'no_encontrado', cliente }.
 */
export async function ubicarClienteAutomatico(clienteId) {
  const { data } = await apiClient.post(`/geolocalizacion/clientes/${clienteId}/ubicar-automatico`)
  return data
}

/**
 * Busca una dirección (Nominatim vía el back). Sin localidad, el back usa la más común entre los
 * clientes de la empresa. Devuelve { localidad, resultados: [{ latitud, longitud, etiqueta, exacta }] }.
 */
export async function buscarDireccion({ direccion, localidad }) {
  const { data } = await apiClient.get('/geolocalizacion/buscar-direccion', {
    params: { direccion, localidad: localidad || undefined },
  })
  return data
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