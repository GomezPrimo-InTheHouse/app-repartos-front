// import { apiClient } from './client'

// /**
//  * Normaliza los campos numéricos que el backend devuelve como string
//  * (mismo comportamiento por defecto de `pg` con NUMERIC/BIGINT que ya
//  * vimos en clientes y productos).
//  */
// function normalizarDespacho(despacho) {
//   return {
//     ...despacho,
//     numero: Number(despacho.numero),
//     total: Number(despacho.total),
//   }
// }

// function normalizarItem(item) {
//   return {
//     ...item,
//     cantidad: Number(item.cantidad),
//     precio_unitario: Number(item.precio_unitario),
//     costo_unitario: Number(item.costo_unitario),
//     subtotal: Number(item.subtotal),
//   }
// }

// /**
//  * Listado de despachos (solo cabecera, sin items — ver fetchDespacho para eso).
//  * Devuelve { despachos, total } — `total` es la cantidad real de filas que
//  * matchean el filtro, sin paginar, para armar controles de paginación.
//  */
// export async function fetchDespachos({ clienteId, estado, desde, hasta, limit, offset } = {}) {
//   const { data } = await apiClient.get('/despachos', {
//     params: {
//       cliente_id: clienteId,
//       estado,
//       desde,
//       hasta,
//       limit,
//       offset,
//     },
//   })
//   return {
//     despachos: data.despachos.map(normalizarDespacho),
//     total: data.total,
//   }
// }

// /**
//  * Detalle de un despacho puntual, incluye `items` (el listado general no los trae).
//  */
// export async function fetchDespacho(id) {
//   const { data } = await apiClient.get(`/despachos/${id}`)
//   const despacho = data.despacho ?? data
//   return {
//     ...normalizarDespacho(despacho),
//     items: despacho.items.map(normalizarItem),
//   }
// }

// /**
//  * Crea un despacho. precio_unitario/costo_unitario NUNCA se envían: el
//  * backend los toma automáticamente del producto en el momento de la venta.
//  * payload: { cliente_id, items: [{ producto_id, cantidad }], notas? }
//  */
// export async function crearDespacho(payload) {
//   const { data } = await apiClient.post('/despachos', payload)
//   const despacho = data.despacho ?? data
//   return normalizarDespacho(despacho)
// }

// /**
//  * Anula un despacho. `motivo` no es obligatorio a nivel backend, pero el
//  * frontend lo exige en el formulario para mantener trazabilidad.
//  */
// export async function anularDespacho({ id, motivo }) {
//   const { data } = await apiClient.post(`/despachos/${id}/anular`, { motivo })
//   const despacho = data.despacho ?? data
//   return normalizarDespacho(despacho)
// }


import { apiClient } from './client'

/**
 * Normaliza los campos numéricos que el backend devuelve como string
 * (mismo comportamiento por defecto de `pg` con NUMERIC/BIGINT que ya
 * vimos en clientes y productos).
 */
function normalizarDespacho(despacho) {
  return {
    ...despacho,
    numero: Number(despacho.numero),
    total: Number(despacho.total),
  }
}

function normalizarItem(item) {
  return {
    ...item,
    cantidad: Number(item.cantidad),
    precio_unitario: Number(item.precio_unitario),
    costo_unitario: Number(item.costo_unitario),
    subtotal: Number(item.subtotal),
  }
}

/**
 * Listado de despachos (solo cabecera, sin items — ver fetchDespacho para eso).
 * Devuelve { despachos, total } — `total` es la cantidad real de filas que
 * matchean el filtro, sin paginar, para armar controles de paginación.
 */
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

/**
 * Detalle de un despacho puntual, incluye `items` (el listado general no los trae).
 */
export async function fetchDespacho(id) {
  const { data } = await apiClient.get(`/despachos/${id}`)
  const despacho = data.despacho ?? data
  return {
    ...normalizarDespacho(despacho),
    items: despacho.items.map(normalizarItem),
  }
}

/**
 * Crea un despacho. precio_unitario/costo_unitario NUNCA se envían: el
 * backend los toma automáticamente del producto en el momento de la venta.
 * payload: { cliente_id, items: [{ producto_id, cantidad }], notas? }
 */
export async function crearDespacho(payload) {
  const { data } = await apiClient.post('/despachos', payload)
  const despacho = data.despacho ?? data
  return normalizarDespacho(despacho)
}

/**
 * Anula un despacho. `motivo` no es obligatorio a nivel backend, pero el
 * frontend lo exige en el formulario para mantener trazabilidad.
 */
export async function anularDespacho({ id, motivo }) {
  const { data } = await apiClient.post(`/despachos/${id}/anular`, { motivo })
  const despacho = data.despacho ?? data
  return normalizarDespacho(despacho)
}