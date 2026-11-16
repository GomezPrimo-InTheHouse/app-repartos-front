// Aviso por WhatsApp a clientes, sin costo: arma un link wa.me con el mensaje escrito.
// El mensaje lo envía la persona desde su propio WhatsApp; el sistema no manda nada solo.
import { escribirLocal, leerLocal } from '@/lib/geolocalizacion'

const CLAVE_PLANTILLA = 'cuaderno:plantilla-aviso-whatsapp'

/** Mensaje de fábrica. {nombre}, {empresa} y {dia} se reemplazan solos al armar el mensaje. */
export const PLANTILLA_POR_DEFECTO =
  'Hola {nombre}! 👋 Te escribimos de {empresa} para avisarte que {dia} pasamos por tu domicilio con el reparto. Si necesitás algo más, respondé este mensaje. ¡Gracias!'

export function leerPlantilla() {
  return leerLocal(CLAVE_PLANTILLA) || PLANTILLA_POR_DEFECTO
}

export function guardarPlantilla(plantilla) {
  escribirLocal(CLAVE_PLANTILLA, plantilla)
}

export function restablecerPlantilla() {
  escribirLocal(CLAVE_PLANTILLA, '')
}

/** Reemplaza {nombre}, {empresa} y {dia} en la plantilla. */
export function armarMensaje(plantilla, { nombre, empresa, dia }) {
  return plantilla
    .replaceAll('{nombre}', nombre || '')
    .replaceAll('{empresa}', empresa || 'tu sodería')
    .replaceAll('{dia}', dia)
}

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Reemplaza la palabra del día ("hoy" / "mañana") por otra, solo como palabra completa. */
export function cambiarDia(mensaje, diaAnterior, diaNuevo) {
  if (diaAnterior === diaNuevo) return mensaje
  return mensaje.replace(new RegExp(`(^|[^\\p{L}])${escaparRegex(diaAnterior)}(?![\\p{L}])`, 'gu'), `$1${diaNuevo}`)
}

/**
 * Convierte un mensaje ya armado para un cliente en plantilla reutilizable: vuelve a poner
 * {nombre}, {empresa} y {dia} donde estaban esos datos. Sirve para "Guardar como predeterminado".
 */
export function mensajeAPlantilla(mensaje, { nombre, empresa, dia }) {
  let plantilla = mensaje
  if (nombre) plantilla = plantilla.replaceAll(nombre, '{nombre}')
  if (empresa) plantilla = plantilla.replaceAll(empresa, '{empresa}')
  return cambiarDia(plantilla, dia, '{dia}')
}

/**
 * Lleva un teléfono argentino al formato internacional que usa WhatsApp: 549 + área + número.
 * Acepta como lo escribe la gente: "0353 15-412-3456", "353 4123456", "+54 9 353 412 3456".
 * Devuelve los dígitos ("5493534123456") o null si no se puede interpretar.
 */
export function normalizarTelefonoAR(texto) {
  let d = String(texto ?? '').replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('54')) {
    d = d.slice(2)
    if (d.startsWith('9')) d = d.slice(1)
  }
  if (d.startsWith('0')) d = d.slice(1)
  // El "15" de los celulares va después del código de área (2 a 4 dígitos) y WhatsApp no lo usa
  if (d.length === 12) {
    for (const largoArea of [3, 2, 4]) {
      if (d.slice(largoArea, largoArea + 2) === '15') {
        d = d.slice(0, largoArea) + d.slice(largoArea + 2)
        break
      }
    }
  }
  return d.length === 10 ? `549${d}` : null
}

/** "5493534123456" → "+54 9 353 412-3456" (para mostrar a qué número se va a mandar). */
export function formatearTelefonoAR(normalizado) {
  if (!normalizado) return ''
  const local = normalizado.slice(3)
  return `+54 9 ${local.slice(0, 3)} ${local.slice(3, 6)}-${local.slice(6)}`
}

export function linkWhatsApp(normalizado, mensaje) {
  return `https://wa.me/${normalizado}?text=${encodeURIComponent(mensaje)}`
}

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

/** Día de la semana de hoy en Argentina, como lo guardan las listas ("lunes", "miercoles"…). */
function diaDeHoyAR() {
  const nombre = new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'America/Argentina/Buenos_Aires' })
    .format(new Date())
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  return DIAS.includes(nombre) ? nombre : DIAS[new Date().getDay()]
}

function fechaDeHoyAR() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
}

/** "hoy" si la lista toca hoy; si no, "mañana" (el aviso se manda el día anterior). */
export function diaSugerido({ tipo, diasSemana, fecha }) {
  if (tipo === 'semanal' && (diasSemana ?? []).includes(diaDeHoyAR())) return 'hoy'
  if (tipo !== 'semanal' && fecha && String(fecha).slice(0, 10) === fechaDeHoyAR()) return 'hoy'
  return 'mañana'
}