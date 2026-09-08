import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Sección de "devolución de envases sueltos" dentro de NuevoDespachoDialog.
 *
 * Aislada en su propio archivo a propósito: todo el mecanismo de
 * "despacho solo devolución" vive acá + en el feature flag
 * FEATURE_DEVOLUCION_SIN_PRODUCTO. Si el negocio deja de necesitarlo, se
 * borra este archivo, el import en NuevoDespachoDialog, y el chequeo del
 * flag — sin dejar lógica residual desperdigada.
 *
 * Solo lista productos con maneja_envase y saldo > 0 en poder del cliente
 * que NO estén ya en el carrito de items (si el cliente está comprando ese
 * producto en este mismo despacho, la devolución de ese producto se carga
 * en el campo "envases_devueltos" del item, no acá — así lo pide el
 * contrato del backend).
 *
 * `valores` es un map { [producto_id]: string } con lo tipeado por el
 * usuario. El padre es dueño del estado; este componente solo lo muestra
 * y dispara `onChange`.
 */
export function DevolucionEnvasesSection({ envasesDisponibles, valores, onChange }) {
  if (envasesDisponibles.length === 0) return null

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
      <Label>Devolución de envases (sin compra de producto)</Label>
      <p className="text-xs text-muted-foreground">
        Para cuando el cliente solo devuelve envases vacíos, sin llevarse mercadería nueva.
      </p>
      {envasesDisponibles.map((e) => {
        const valor = valores[e.producto_id] ?? ''
        const excedeSaldo = Number(valor) > e.saldo
        return (
          <div key={e.producto_id} className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-sm">{e.producto_nombre}</span>
              <span className="text-xs text-muted-foreground">En poder del cliente: {e.saldo}</span>
            </div>
            <Input
              type="number"
              min="0"
              max={e.saldo}
              inputMode="numeric"
              className="w-24"
              value={valor}
              onChange={(event) => onChange(e.producto_id, event.target.value)}
              aria-invalid={excedeSaldo || undefined}
            />
          </div>
        )
      })}
    </div>
  )
}