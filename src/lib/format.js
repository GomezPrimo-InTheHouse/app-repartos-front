const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export function formatCurrency(value) {
  const num = Number(value ?? 0)
  return currencyFormatter.format(num)
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatDate(value) {
  if (!value) return '—'
  return dateFormatter.format(new Date(value))
}
