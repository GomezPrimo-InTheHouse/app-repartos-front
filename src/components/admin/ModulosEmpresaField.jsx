import { Label } from '@/components/ui/label'
import { MODULOS_BASE, MODULOS_CONTRATABLES } from '@/lib/modulos'

/** Casillas de módulos contratados por una empresa (mismo estilo que "Módulos permitidos" de Mi equipo). */
export function ModulosEmpresaField({ value, onChange }) {
  function toggle(clave) {
    onChange(value.includes(clave) ? value.filter((m) => m !== clave) : [...value, clave])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Módulos contratados</Label>
      <p className="text-xs text-muted-foreground">
        Siempre incluidos: {MODULOS_BASE.join(', ')}.
      </p>
      <div className="flex flex-col gap-3 rounded-md border border-border p-3">
        {MODULOS_CONTRATABLES.map((modulo) => (
          <label key={modulo.clave} className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.includes(modulo.clave)}
              onChange={() => toggle(modulo.clave)}
              className="mt-0.5 size-4 shrink-0 rounded border-border"
            />
            <span className="flex flex-col">
              <span>{modulo.etiqueta}</span>
              <span className="text-xs text-muted-foreground">{modulo.ayuda}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}