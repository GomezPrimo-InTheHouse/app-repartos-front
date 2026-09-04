import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * RecordCard genérico para listados (reemplaza a Table en todos los módulos,
 * mobile y desktop por igual — ver sección 4.1 del contexto del proyecto).
 *
 * Composición en tres bloques:
 * - `title` / `badge`: encabezado de la card (ej. nombre del cliente + estado activo/inactivo)
 * - `fields`: lista de pares label/value con los datos principales del registro
 * - `actions`: los botones "Ver" / "Editar" (u otros), alineados a la derecha
 *
 * Cada módulo (Clientes, Productos, Despachos, Pagos) arma su propio array de
 * `fields` según qué datos son relevantes mostrar en el listado.
 */
export function RecordCard({ title, badge, fields = [], actions, className }) {
  return (
    <Card className={cn('gap-3', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <p className="font-display text-base font-semibold leading-tight text-foreground">
          {title}
        </p>
        {badge}
      </CardHeader>

      {fields.length > 0 && (
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {fields.map(({ label, value }) => (
            <RecordCardField key={label} label={label} value={value} />
          ))}
        </CardContent>
      )}

      {actions && (
        <CardFooter className="flex justify-end gap-2 border-t border-border pt-3">
          {actions}
        </CardFooter>
      )}
    </Card>
  )
}

function RecordCardField({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value ?? '—'}</span>
    </div>
  )
}