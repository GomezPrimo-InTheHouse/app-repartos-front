/** Devuelve una copia de la lista con el elemento de la posición `desde` movido a la posición `hasta`. */
export function moverElemento(lista, desde, hasta) {
  if (desde === hasta || desde < 0 || hasta < 0 || desde >= lista.length || hasta >= lista.length) {
    return lista
  }
  const copia = lista.slice()
  const [elemento] = copia.splice(desde, 1)
  copia.splice(hasta, 0, elemento)
  return copia
}