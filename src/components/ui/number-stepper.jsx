import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Campo numérico entero con botones − / + (pensado para mobile: botones de 44px).
 * Trabaja con string, igual que un <Input type="number"> controlado: value y onChange(string).
 * - Mientras se escribe se permite el campo vacío; al salir (blur) se ajusta a [min, max].
 * - Los botones nunca bajan de min ni pasan de max.
 */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  id,
  className,
  disabled = false,
  'aria-label': ariaLabel,
}) {
  const numero = Number(value)
  const esValido = value !== '' && Number.isFinite(numero)
  const actual = esValido ? numero : min

  function ajustar(n) {
    let resultado = Math.max(min, n)
    if (max !== undefined) resultado = Math.min(max, resultado)
    return resultado
  }

  function cambiar(delta) {
    onChange(String(ajustar(actual + delta)))
  }

  function handleInput(event) {
    // Solo dígitos: evita "e", "-", "," y decimales que permite type="number"
    onChange(event.target.value.replace(/\D/g, ''))
  }

  function handleBlur() {
    onChange(String(ajustar(esValido ? numero : min)))
  }

  const botonClase =
    'flex w-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 md:w-10'

  return (
    <div
      className={cn(
        'inline-flex h-11 items-stretch overflow-hidden rounded-md border border-input bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring md:h-10',
        disabled && 'opacity-50',
        className
      )}
    >
      <button
        type="button"
        className={botonClase}
        onClick={() => cambiar(-step)}
        disabled={disabled || actual <= min}
        aria-label="Disminuir"
      >
        <Minus className="size-4" />
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleInput}
        onBlur={handleBlur}
        disabled={disabled}
        aria-label={ariaLabel}
        className="w-12 min-w-0 flex-1 border-x border-input bg-transparent text-center font-mono-num text-base text-foreground focus:outline-none md:text-sm"
      />
      <button
        type="button"
        className={botonClase}
        onClick={() => cambiar(step)}
        disabled={disabled || (max !== undefined && actual >= max)}
        aria-label="Aumentar"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}