import L from 'leaflet'

// Íconos HTML (divIcon): evitan los PNG por defecto de Leaflet, que se rompen con Vite,
// y permiten numerar y colorear cada pin con los colores del sistema.

const COLORES = {
  alDia: '#3D6B4F', // ledger-green
  conDeuda: '#B5651D', // copper
  excedido: '#A8362D', // ledger-red
  repartidor: '#1C2B33', // ink
  desactualizado: '#8A9399',
  seleccionado: '#1C2B33',
}

function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

/** Estado de deuda de un cliente: 'alDia' | 'conDeuda' | 'excedido' (supera su límite de crédito). */
export function estadoDeuda(cliente) {
  if (cliente.saldo <= 0) return 'alDia'
  if (cliente.limite_credito > 0 && cliente.saldo > cliente.limite_credito) return 'excedido'
  return 'conDeuda'
}

export const ETIQUETAS_DEUDA = {
  alDia: 'Al día',
  conDeuda: 'Con deuda',
  excedido: 'Supera su límite',
}

export function colorDeuda(estado) {
  return COLORES[estado]
}

/** Pin de cliente: círculo de color con el número de orden de visita (o vacío). */
export function iconoCliente(estado, numero) {
  const color = COLORES[estado] ?? COLORES.alDia
  const texto = numero === null || numero === undefined ? '' : escaparHtml(numero)
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:${color};color:#fff;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font:600 12px Inter,system-ui,sans-serif">${texto}</div>`,
  })
}

/** Pin de repartidor: gota con sus iniciales; gris si la posición está desactualizada. */
export function iconoRepartidor(nombre, vigente) {
  const color = vigente ? COLORES.repartidor : COLORES.desactualizado
  const iniciales = escaparHtml(
    String(nombre ?? '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  )
  return L.divIcon({
    className: '',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -40],
    html: `<div style="position:relative;width:34px;height:42px">
      <div style="width:34px;height:34px;border-radius:9999px 9999px 9999px 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>
      <div style="position:absolute;top:0;left:0;width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:#fff;font:600 12px Inter,system-ui,sans-serif">${iniciales}</div>
    </div>`,
  })
}

/** Punto elegido al ubicar un cliente. */
export function iconoSeleccion() {
  return iconoCliente('seleccionado', '')
}