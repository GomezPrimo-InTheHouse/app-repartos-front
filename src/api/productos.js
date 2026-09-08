import { apiClient } from './client'

/**
 * El backend devuelve costo_unitario, precio_venta, stock_actual y
 * stock_minimo como string (comportamiento por defecto de la librería `pg`
 * con columnas NUMERIC/DECIMAL). Se normalizan a number acá, en el borde de
 * la app, para que el resto del frontend siempre trabaje con números limpios
 * sin importar si el backend lo corrige más adelante.
 */
function normalizarProducto(producto) {
  return {
    ...producto,
    costo_unitario: Number(producto.costo_unitario),
    precio_venta: Number(producto.precio_venta),
    stock_actual: Number(producto.stock_actual),
    stock_minimo: Number(producto.stock_minimo),
  }
}

/**
 * Listado de productos SIN paginar — devuelve el array directo.
 * Usado en selectores (carrito de despacho, etc.) donde se necesitan todos
 * los productos que matcheen el filtro, no una página puntual.
 */
export async function fetchProductos({ busqueda, activo, stockBajo } = {}) {
  const { data } = await apiClient.get('/productos', {
    params: { busqueda, activo, stockBajo },
  })
  const productos = data.productos ?? data
  return productos.map(normalizarProducto)
}

/**
 * Listado de productos PAGINADO — devuelve { productos, total }.
 * Usado en ProductosPage (el listado principal). Misma normalización de
 * campos numéricos que fetchProductos.
 */
export async function fetchProductosPaginado({ busqueda, activo, stockBajo, limit, offset } = {}) {
  const { data } = await apiClient.get('/productos', {
    params: { busqueda, activo, stockBajo, limit, offset },
  })
  const productos = (data.productos ?? []).map(normalizarProducto)
  return { productos, total: data.total }
}

export async function fetchProducto(id) {
  const { data } = await apiClient.get(`/productos/${id}`)
  const producto = data.producto ?? data
  return normalizarProducto(producto)
}

export async function crearProducto(payload) {
  const { data } = await apiClient.post('/productos', payload)
  const producto = data.producto ?? data
  return normalizarProducto(producto)
}

export async function actualizarProducto({ id, ...payload }) {
  const { data } = await apiClient.put(`/productos/${id}`, payload)
  const producto = data.producto ?? data
  return normalizarProducto(producto)
}

export async function eliminarProducto(id) {
  await apiClient.delete(`/productos/${id}`)
}