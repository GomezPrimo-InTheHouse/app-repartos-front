import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

/**
 * Controles para cambiar la posición de un cliente dentro del recorrido:
 * flechas para correrlo de a uno y un selector para mandarlo directo a una posición
 * (útil en listas largas: "este cliente va 14°").
 * `index` es 0-based; el selector muestra posiciones desde 1.
 */
export function ControlPosicion({ index, total, nombre, onMover, disabled = false }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button" variant="outline" size="icon" className="h-8 w-8"
        disabled={disabled || index === 0}
        onClick={() => onMover(index - 1)}
        aria-label={`Subir a ${nombre}`}
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        type="button" variant="outline" size="icon" className="h-8 w-8"
        disabled={disabled || index === total - 1}
        onClick={() => onMover(index + 1)}
        aria-label={`Bajar a ${nombre}`}
      >
        <ChevronDown className="size-4" />
      </Button>
      <Select
        value={String(index)}
        onValueChange={(valor) => onMover(Number(valor))}
        disabled={disabled || total < 2}
      >
        <SelectTrigger className="h-8 w-[4.5rem] px-2" aria-label={`Posición de ${nombre}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: total }, (_, i) => (
            <SelectItem key={i} value={String(i)}>{i + 1}°</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}