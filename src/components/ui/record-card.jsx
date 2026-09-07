// import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
// import { cn } from '@/lib/utils'

// /**
//  * RecordCard genérico para listados (reemplaza a Table en todos los módulos,
//  * mobile y desktop por igual — ver sección 4.1 del contexto del proyecto).
//  *
//  * Composición en tres bloques:
//  * - `title` / `badge`: encabezado de la card (ej. nombre del cliente + estado activo/inactivo)
//  * - `fields`: lista de pares label/value con los datos principales del registro
//  * - `actions`: los botones "Ver" / "Editar" (u otros), alineados a la derecha
//  *
//  * Cada módulo (Clientes, Productos, Despachos, Pagos) arma su propio array de
//  * `fields` según qué datos son relevantes mostrar en el listado.
//  */
// export function RecordCard({ title, badge, fields = [], actions, className }) {
//   return (
//     <Card className={cn('gap-3', className)}>
//       <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
//         <p className="font-display text-base font-semibold leading-tight text-foreground">
//           {title}
//         </p>
//         {badge}
//       </CardHeader>

//       {fields.length > 0 && (
//         <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
//           {fields.map(({ label, value }) => (
//             <RecordCardField key={label} label={label} value={value} />
//           ))}
//         </CardContent>
//       )}

//       {actions && (
//         <CardFooter className="flex justify-end gap-2 border-t border-border pt-3">
//           {actions}
//         </CardFooter>
//       )}
//     </Card>
//   )
// }

// function RecordCardField({ label, value }) {
//   return (
//     <div className="flex flex-col gap-0.5">
//       <span className="text-xs text-muted-foreground">{label}</span>
//       <span className="text-sm font-medium text-foreground">{value ?? '—'}</span>
//     </div>
//   )
// }

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * RecordCard genérico para listados — versión compacta.
 * Reduce paddings, tamaños de fuente y gaps respecto a la versión
 * original, para que cada card ocupe menos espacio vertical/horizontal.
 * Afecta a TODOS los módulos que usan este componente (Clientes,
 * Productos, Despachos, Pagos, Reparto) — es un cambio global de diseño.
 */
export function RecordCard({ title, badge, fields = [], actions, className }) {
  return (
    <Card className={cn('gap-2 py-3', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 px-3">
        <p className="font-display text-sm font-semibold leading-tight text-foreground">
          {title}
        </p>
        {badge}
      </CardHeader>

      {fields.length > 0 && (
        <CardContent className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-3 sm:grid-cols-3">
          {fields.map(({ label, value }) => (
            <RecordCardField key={label} label={label} value={value} />
          ))}
        </CardContent>
      )}

      {actions && (
        <CardFooter className="flex justify-end gap-1.5 border-t border-border px-3 pt-2">
          {actions}
        </CardFooter>
      )}
    </Card>
  )
}

function RecordCardField({ label, value }) {
  return (
    <div className="flex flex-col gap-0">
      <span className="text-[11px] leading-tight text-muted-foreground">{label}</span>
      <span className="text-xs font-medium leading-tight text-foreground">{value ?? '—'}</span>
    </div>
  )
}