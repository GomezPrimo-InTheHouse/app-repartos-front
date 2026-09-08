/**
 * Flags de features que se puedan dar de baja fácilmente sin tocar
 * el resto del sistema.
 *
 * FEATURE_DEVOLUCION_SIN_PRODUCTO: habilita registrar la devolución de
 * envases retornables sin que el cliente lleve producto nuevo, como un
 * despacho más (tipo: "solo_devolucion") en su historial.
 *
 * Para dar de baja este mecanismo: cambiar a `false` acá. Con eso
 * desaparece de NuevoDespachoDialog y del historial de Despachos sin
 * tocar ningún otro archivo. El código relacionado queda aislado en
 * components/despachos/DevolucionEnvasesSection.jsx y puede borrarse por
 * completo más adelante con confianza.
 */
export const FEATURE_DEVOLUCION_SIN_PRODUCTO = true