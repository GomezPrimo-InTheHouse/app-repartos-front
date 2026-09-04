import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases de Tailwind evitando conflictos (ej. "p-2" vs "p-4").
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
