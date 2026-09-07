import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * RecordCard genérico para listados — versión compacta.
 *
 * Dos ajustes para que las cards de una misma fila queden prolijas incluso
 * con títulos de distinto largo:
 * - `h-full flex flex-col` en la Card: ocupa toda la altura de su celda de
 *   grid (CSS grid ya estira los items por default), en vez de quedar del
 *   tamaño justo de su contenido.
 * - El título se trunca a una sola línea (`truncate`) con el nombre
 *   completo disponible como tooltip nativo (`title`), para que un nombre
 *   largo no infle la altura del header y desalinee la fila.
 * - El footer usa `mt-auto`, así los botones quedan siempre pegados abajo
 *   de la card, sin importar cuánto contenido tenga el resto.
 * - El footer tiene `pt-3 pb-1` (antes `pt-2` y sin `pb`, apoyado solo en
 *   el `py-3` general de la Card): los botones quedaban casi pegados a la
 *   línea divisoria de arriba y muy justos abajo.
 */
export function RecordCard({ title, badge, fields = [], actions, className }) {
  return (
    <Card className={cn('flex h-full flex-col gap-2 py-3', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 px-3">
        <p
          title={typeof title === 'string' ? title : undefined}
          className="truncate font-display text-sm font-semibold leading-tight text-foreground"
        >
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
        <CardFooter className="mt-auto flex justify-end gap-1.5  px-3 pb-3 pt-3">
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
      <span className="truncate text-xs font-medium leading-tight text-foreground">{value ?? '—'}</span>
    </div>
  )
}