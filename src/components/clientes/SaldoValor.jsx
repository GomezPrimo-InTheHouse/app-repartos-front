import { formatCurrency } from '@/lib/format'

/**
 * Muestra el saldo de un cliente con el color correspondiente:
 * rojo si debe (saldo > 0), verde si está al día o a favor (saldo <= 0).
 */
export function SaldoValor({ saldo }) {
  if (saldo > 0) {
    return <span className="font-mono-num font-semibold text-destructive">{formatCurrency(saldo)}</span>
  }
  if (saldo < 0) {
    return (
      <span className="font-mono-num font-semibold text-success">
        A favor {formatCurrency(Math.abs(saldo))}
      </span>
    )
  }
  return <span className="font-mono-num font-semibold text-success">Al día</span>
}