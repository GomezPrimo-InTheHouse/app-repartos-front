// Documento del titular de una empresa (CUIT / CUIL / DNI), guardado solo con dígitos.

/** Muestra un documento guardado solo con dígitos: CUIT/CUIL como 20-30123456-7, DNI como 30.123.456. */
export function formatDocumento(documento) {
  if (!documento) return null
  const d = String(documento)
  if (d.length === 11) return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`
  if (d.length === 8) return Number(d).toLocaleString('es-AR')
  return d
}