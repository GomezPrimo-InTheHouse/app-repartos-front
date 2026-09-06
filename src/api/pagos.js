import { apiClient } from './client'

/**
 * Normaliza el campo numérico que el backend devuelve como string
 * (mismo comportamiento por defecto de `pg` con NUMERIC ya visto en el
 * resto de la app).
 */
function normalizarPago(pago) {
  return {
    ...pago,
    monto: Number(pago.monto),
  }
}

/**
 * Listado de pagos. Devuelve { pagos, total } — `total` es la cantidad real
 * de filas que matchean el filtro, sin paginar, para armar controles de
 * paginación (mismo patrón que fetchDespachos).
 */
export async function fetchPagos({ clienteId, estado, desde, hasta, limit, offset } = {}) {
  const { data } = await apiClient.get('/pagos', {
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
    pagos: data.pagos.map(normalizarPago),
    total: data.total,
  }
}

/**
 * Crea un pago. payload: { cliente_id, monto, metodo?, despacho_id?, notas?, fecha? }
 * metodo default 'efectivo' si se omite (decisión del backend).
 */
export async function crearPago(payload) {
  const { data } = await apiClient.post('/pagos', payload)
  const pago = data.pago ?? data
  return normalizarPago(pago)
}

/**
 * Anula un pago. `motivo` no es obligatorio a nivel backend, pero el
 * frontend lo exige en el formulario para mantener trazabilidad.
 * Un pago anulado deja de sumar en el cálculo de saldo del cliente.
 */
export async function anularPago({ id, motivo }) {
  const { data } = await apiClient.post(`/pagos/${id}/anular`, { motivo })
  const pago = data.pago ?? data
  return normalizarPago(pago)
}