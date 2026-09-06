import { apiClient } from './client'

function normalizarDespacho(despacho) {
  return {
    ...despacho,
    numero: Number(despacho.numero),
    total: Number(despacho.total),
  }
}

/**
 * Normaliza el item de despacho, incluyendo los campos de historial de
 * envases (envases_devueltos, envases_saldo_anterior, envases_saldo_posterior).
 * Estos ya vienen como number desde el backend, pero pueden venir null —
 * tanto si el producto no maneja envase como si es un despacho viejo sin
 * historial registrado. Se preservan tal cual (null se mantiene null, no
 * se fuerza a 0) para poder distinguir ambos casos en la UI.
 */
function normalizarItem(item) {
  return {
    ...item,
    cantidad: Number(item.cantidad),
    precio_unitario: Number(item.precio_unitario),
    costo_unitario: Number(item.costo_unitario),
    subtotal: Number(item.subtotal),
    envases_devueltos: item.envases_devueltos ?? null,
    envases_saldo_anterior: item.envases_saldo_anterior ?? null,
    envases_saldo_posterior: item.envases_saldo_posterior ?? null,
  }
}

export async function fetchDespachos({ clienteId, estado, desde, hasta, limit, offset } = {}) {
  const { data } = await apiClient.get('/despachos', {
    params: {
      cliente_id: clienteId,
      estado,
      desde,
      hasta,
      limit,
      offset,
    },
  })
  return {
    despachos: data.despachos.map(normalizarDespacho),
    total: data.total,
  }
}

export async function fetchDespacho(id) {
  const { data } = await apiClient.get(`/despachos/${id}`)
  const despacho = data.despacho ?? data
  return {
    ...normalizarDespacho(despacho),
    items: despacho.items.map(normalizarItem),
  }
}

export async function crearDespacho(payload) {
  const { data } = await apiClient.post('/despachos', payload)
  const despacho = data.despacho ?? data
  return normalizarDespacho(despacho)
}

export async function anularDespacho({ id, motivo }) {
  const { data } = await apiClient.post(`/despachos/${id}/anular`, { motivo })
  const despacho = data.despacho ?? data
  return normalizarDespacho(despacho)
}