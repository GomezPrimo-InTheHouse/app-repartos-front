import { apiClient } from './client'

function descargarBlob(blob, nombreArchivo) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function descargarReporteCliente(clienteId, nombreCliente, { desde, hasta } = {}) {
  const { data } = await apiClient.get(`/reportes/cliente/${clienteId}`, {
    params: { desde, hasta },
    responseType: 'blob',
  })
  const nombreArchivo = `estado_cuenta_${nombreCliente.replace(/\s+/g, '_')}.pdf`
  descargarBlob(data, nombreArchivo)
}

export async function descargarReporteGeneral({ desde, hasta } = {}) {
  const { data } = await apiClient.get('/reportes/general', {
    params: { desde, hasta },
    responseType: 'blob',
  })
  descargarBlob(data, 'resumen_general.pdf')
}

/**
 * Comprobante de un pago puntual: datos del pago, saldo resultante de la
 * cuenta, y envases retornables que adeuda el cliente.
 */
export async function descargarComprobantePago(pagoId, nombreCliente) {
  const { data } = await apiClient.get(`/reportes/pago/${pagoId}`, {
    responseType: 'blob',
  })
  const nombreArchivo = `comprobante_pago_${nombreCliente.replace(/\s+/g, '_')}.pdf`
  descargarBlob(data, nombreArchivo)
}