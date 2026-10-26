// Catálogo de módulos del lado del front (espejo de back/src/config/modulos.js).

/** Incluidos en toda empresa: no se contratan aparte. */
export const MODULOS_BASE = ['Inicio', 'Clientes', 'Productos', 'Despachos', 'Pagos']

/** Módulos que el super admin activa por empresa (se guardan en propietarios.modulos). */
export const MODULOS_CONTRATABLES = [
  { clave: 'reparto', etiqueta: 'Reparto', ayuda: 'Listas de reparto y reparto del día' },
  { clave: 'reportes', etiqueta: 'Reportes', ayuda: 'Estado de cuenta y resumen general en PDF' },
  { clave: 'equipo', etiqueta: 'Mi equipo', ayuda: 'Empleados con acceso propio. Sin esto, solo ingresa el administrador' },
  { clave: 'produccion', etiqueta: 'Producción', ayuda: 'Stock y fabricación. Los despachos descuentan stock' },
  { clave: 'geolocalizacion', etiqueta: 'Mapa', ayuda: 'Clientes y repartidores en el mapa' },
]

export const CLAVES_CONTRATABLES = MODULOS_CONTRATABLES.map((m) => m.clave)

export function etiquetaModulo(clave) {
  return MODULOS_CONTRATABLES.find((m) => m.clave === clave)?.etiqueta ?? clave
}

/** Ordena según el catálogo y descarta claves desconocidas. */
export function ordenarModulos(modulos = []) {
  return CLAVES_CONTRATABLES.filter((clave) => modulos.includes(clave))
}

// Avisos al cambiar un módulo con efectos sobre datos o usuarios existentes.
const AVISOS_ACTIVAR = {
  produccion: 'Producción: los productos arrancan con stock 0; hay que cargar el stock inicial (Producción → Registrar → Ajuste +) antes de seguir despachando.',
  geolocalizacion: 'Mapa: cada empleado verá un aviso y, si acepta, su ubicación se envía al abrir la app.',
}
const AVISOS_DESACTIVAR = {
  equipo: 'Mi equipo: los vendedores de la empresa dejan de poder ingresar (vuelven a tener acceso si se reactiva).',
  produccion: 'Producción: los despachos dejan de controlar y descontar stock. El stock cargado se conserva.',
  reparto: 'Reparto: las listas y el historial se conservan, pero dejan de verse.',
  geolocalizacion: 'Mapa: los empleados dejan de enviar su ubicación. Las ubicaciones de clientes se conservan.',
}

/** Resumen de cambios entre dos listas de módulos, para el diálogo de confirmación. */
export function resumenCambiosModulos(antes = [], despues = []) {
  const activados = despues.filter((m) => !antes.includes(m))
  const desactivados = antes.filter((m) => !despues.includes(m))
  const avisos = [
    ...activados.map((m) => AVISOS_ACTIVAR[m]),
    ...desactivados.map((m) => AVISOS_DESACTIVAR[m]),
  ].filter(Boolean)
  return { activados, desactivados, avisos, hayCambios: activados.length + desactivados.length > 0 }
}