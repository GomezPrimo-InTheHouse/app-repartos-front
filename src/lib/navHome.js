/**
 * Determina a qué ruta mandar a un usuario cuando no tiene acceso a donde
 * intentaba entrar (o al loguearse). Evita el loop infinito que se daría
 * si redirigiéramos siempre a "/", ya que esa ruta también requiere el
 * permiso "dashboard" — un vendedor sin ese permiso (ej. un repartidor que
 * solo tiene "reparto") rebotaría para siempre.
 *
 * Orden de prioridad: si tiene "dashboard", esa es su home. Si no, se
 * prueba con el resto de los módulos en este orden, y se usa el primero
 * al que tenga acceso. Si no tiene ningún permiso (caso raro, vendedor
 * recién creado sin módulos), se manda a /sin-acceso en vez de loopear.
 */
const ORDEN_HOME = [
  { permiso: 'dashboard', path: '/' },
  { permiso: 'reparto', path: '/reparto' },
  { permiso: 'clientes', path: '/clientes' },
  { permiso: 'despachos', path: '/despachos' },
  { permiso: 'pagos', path: '/pagos' },
  { permiso: 'productos', path: '/productos' },
  { permiso: 'reportes', path: '/reportes' },
]

export function getHomeRoute(rol, tienePermiso) {
  if (rol === 'super_admin') return '/admin'

  const encontrado = ORDEN_HOME.find((item) => tienePermiso(item.permiso))
  return encontrado ? encontrado.path : '/sin-acceso'
}