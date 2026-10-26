import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useReportarUbicacion } from '@/hooks/useReportarUbicacion'

/**
 * Montado una vez en el AppShell. Envía la ubicación al abrir la app (si la empresa usa
 * Geolocalización) y, la primera vez, explica qué se comparte antes del permiso del navegador.
 */
export function AvisoUbicacion() {
  const { necesitaAviso, aceptar, rechazar } = useReportarUbicacion()

  return (
    <Dialog open={necesitaAviso} onOpenChange={(abierto) => { if (!abierto) rechazar() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="size-5" />
            Compartir tu ubicación
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>
                Tu empresa usa el mapa de reparto. Para eso, cuando abrís o volvés a esta app se envía tu
                ubicación actual al administrador.
              </p>
              <ul className="list-disc pl-5">
                <li>Solo mientras la app está abierta: no hay seguimiento en segundo plano.</li>
                <li>Se guarda únicamente la última posición, no tu recorrido.</li>
                <li>Lo ve solo el administrador de tu empresa.</li>
              </ul>
              <p>Al aceptar, el navegador te va a pedir permiso de ubicación.</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={rechazar}>Ahora no</Button>
          <Button type="button" onClick={aceptar}>Aceptar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}