import { useEffect, useState } from 'react'

/**
 * Devuelve una versión "demorada" de `value`, que solo se actualiza después
 * de `delayMs` sin cambios. Pensado para buscadores: evita disparar una
 * request por cada tecla que se tipea.
 */
export function useDebouncedValue(value, delayMs = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return debounced
}