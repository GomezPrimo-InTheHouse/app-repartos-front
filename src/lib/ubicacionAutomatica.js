import { toast } from 'sonner'
import { ubicarClienteAutomatico } from '@/api/geolocalizacion'

// Por qué un cliente no quedó ubicado, en palabras para el usuario
const MOTIVOS = {
  sin_direccion: 'no tiene dirección cargada',
  aproximado: 'el mapa solo tiene la calle, no la altura',
  no_encontrado: 'no se encontró la dirección',
  error: 'el buscador no respondió',
}

const MAX_NOMBRES_EN_AVISO = 5

/**
 * Intenta ubicar a varios clientes, de a uno (el buscador gratuito admite un pedido por segundo,
 * así que cada cliente tarda alrededor de 1 segundo; los que ya están ubicados no esperan).
 * clientes: [{ id, nombre }]. Devuelve { ubicados, sinUbicar: [{ nombre, motivo }], cancelado }.
 */
export async function ubicarEnLote(clientes, { onProgreso, debeCancelar } = {}) {
  const resumen = { ubicados: [], sinUbicar: [], cancelado: false }
  let erroresSeguidos = 0

  for (let i = 0; i < clientes.length; i += 1) {
    if (debeCancelar?.()) {
      resumen.cancelado = true
      break
    }
    const cliente = clientes[i]
    try {
      const { estado } = await ubicarClienteAutomatico(cliente.id)
      erroresSeguidos = 0
      if (estado === 'ubicado') resumen.ubicados.push(cliente.nombre)
      else if (estado !== 'ya_ubicado') resumen.sinUbicar.push({ nombre: cliente.nombre, motivo: estado })
    } catch {
      erroresSeguidos += 1
      resumen.sinUbicar.push({ nombre: cliente.nombre, motivo: 'error' })
      // Si el buscador está caído no tiene sentido seguir: los que faltan quedan sin ubicar
      if (erroresSeguidos >= 3) {
        clientes.slice(i + 1).forEach((c) => resumen.sinUbicar.push({ nombre: c.nombre, motivo: 'error' }))
        onProgreso?.(clientes.length, clientes.length)
        break
      }
    }
    onProgreso?.(i + 1, clientes.length)
  }
  return resumen
}

/**
 * Avisa cómo terminó la ubicación automática. Si alguno no se pudo ubicar, el aviso queda
 * en pantalla un rato largo y dice cuáles son, para ubicarlos a mano desde el Mapa.
 */
export function avisarResultadoUbicacion(resumen, { irAlMapa } = {}) {
  const { ubicados, sinUbicar, cancelado } = resumen
  const textoUbicados = ubicados.length
    ? `${ubicados.length} cliente${ubicados.length === 1 ? '' : 's'} ubicado${ubicados.length === 1 ? '' : 's'} en el mapa.`
    : ''

  if (sinUbicar.length === 0) {
    if (ubicados.length) toast.success(textoUbicados + (cancelado ? ' Se canceló el resto.' : ''))
    else if (cancelado) toast.info('Se canceló la ubicación automática.')
    return
  }

  const nombres = sinUbicar
    .slice(0, MAX_NOMBRES_EN_AVISO)
    .map((c) => `• ${c.nombre}: ${MOTIVOS[c.motivo] ?? 'no se pudo ubicar'}`)
  if (sinUbicar.length > MAX_NOMBRES_EN_AVISO) {
    nombres.push(`… y ${sinUbicar.length - MAX_NOMBRES_EN_AVISO} más.`)
  }

  toast.warning(
    `${sinUbicar.length} cliente${sinUbicar.length === 1 ? '' : 's'} sin ubicar en el mapa`,
    {
      description: (
        [textoUbicados, ...nombres, 'Ubicalos a mano desde el Mapa (botón "Ubicar").']
          .filter(Boolean)
          .join('\n')
      ),
      duration: 20000,
      closeButton: true,
      classNames: { description: 'whitespace-pre-line' },
      ...(irAlMapa ? { action: { label: 'Ir al Mapa', onClick: irAlMapa } } : {}),
    }
  )
}