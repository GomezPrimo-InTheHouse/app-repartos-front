import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Sparkles, Upload, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { importarClientesExcel } from '@/api/clientes'
import { getApiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function nombreDeFila(fila) {
  return fila?.nombre ?? null
}

function textoParaCopiar(omitidos) {
  return omitidos
    .map((o) => `${nombreDeFila(o.fila) ?? 'Fila sin nombre identificable'} — ${o.motivo}`)
    .join('\n')
}

export function ImportarClientesDialog({ trigger }) {
  const [open, setOpen] = useState(false)
  const [archivo, setArchivo] = useState(null)
  const [resultado, setResultado] = useState(null)
  const queryClient = useQueryClient()

  function resetEstado() {
    setArchivo(null)
    setResultado(null)
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen) resetEstado()
    setOpen(nextOpen)
  }

  const mutation = useMutation({
    mutationFn: () => importarClientesExcel(archivo),
    onSuccess: (data) => {
      setResultado(data)
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo importar el archivo'))
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    if (!archivo) return
    mutation.mutate()
  }

  async function handleCopiarOmitidos() {
    try {
      await navigator.clipboard.writeText(textoParaCopiar(resultado.omitidos))
      toast.success('Lista de omitidos copiada al portapapeles')
    } catch {
      toast.error('No se pudo copiar la lista')
    }
  }

  // Total de clientes generados por división automática, para el resumen
  // ("3 filas generaron 6 clientes"). filasDivididas puede venir vacío.
  const totalDivididos =
    resultado?.filasDivididas?.reduce((acc, f) => acc + f.clientesGenerados.length, 0) ?? 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar clientes desde Excel</DialogTitle>
          {!resultado && (
            <DialogDescription>
              Subí un archivo .xlsx o .xls con tus clientes. El sistema detecta los datos
              automáticamente. Máximo 200 filas y 5MB por archivo.
            </DialogDescription>
          )}
        </DialogHeader>

        {!resultado && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="archivo-excel">Archivo Excel</Label>
              <Input
                id="archivo-excel"
                type="file"
                accept=".xlsx,.xls"
                disabled={mutation.isPending}
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              />
            </div>

            {mutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Procesando… puede tardar unos segundos.
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!archivo || mutation.isPending}>
                <Upload className="size-4" />
                {mutation.isPending ? 'Procesando…' : 'Importar'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {resultado && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{resultado.totalFilasLeidas} filas leídas</span>
              <Badge variant="success">{resultado.creados.length} creados</Badge>
              {resultado.omitidos.length > 0 && (
                <Badge variant="warning">{resultado.omitidos.length} omitidos</Badge>
              )}
              {/* Indicador de método: determinístico = rápido y exacto,
                  ia = respaldo cuando el formato es atípico. */}
              <Badge variant="outline" className="ml-auto gap-1">
                {resultado.metodoExtraccion === 'deterministico' ? (
                  <>
                    <Zap className="size-3" />
                    Lectura exacta
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3" />
                    Con IA
                  </>
                )}
              </Badge>
            </div>

            <Tabs defaultValue="creados">
              <TabsList>
                <TabsTrigger value="creados">Creados ({resultado.creados.length})</TabsTrigger>
                {totalDivididos > 0 && (
                  <TabsTrigger value="divididos">
                    Divididos ({resultado.filasDivididas.length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="omitidos">Omitidos ({resultado.omitidos.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="creados">
                {resultado.creados.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No se creó ningún cliente.</p>
                ) : (
                  <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto py-2">
                    {resultado.creados.map((cliente) => (
                      <li key={cliente.id} className="text-sm">
                        {cliente.nombre}
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              {totalDivididos > 0 && (
                <TabsContent value="divididos">
                  <p className="pb-2 text-xs text-muted-foreground">
                    Se detectaron {resultado.filasDivididas.length} fila(s) con más de un cliente,
                    generando {totalDivididos} cliente(s) nuevo(s). Revisá que la división sea correcta.
                  </p>
                  <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto py-2">
                    {resultado.filasDivididas.map((division, index) => (
                      <li key={index} className="rounded-md bg-muted px-3 py-2 text-sm">
                        <p className="text-xs text-muted-foreground">{division.filaOriginal}</p>
                        <p className="font-medium">
                          → {division.clientesGenerados.join(' + ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              )}

              <TabsContent value="omitidos">
                {resultado.omitidos.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No se omitió ninguna fila.</p>
                ) : (
                  <>
                    <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto py-2">
                      {resultado.omitidos.map((omitido, index) => (
                        <li key={index} className="rounded-md bg-warning-soft px-3 py-2 text-sm">
                          <span className="font-medium">
                            {nombreDeFila(omitido.fila) ?? 'Fila sin nombre identificable'}
                          </span>
                          <span className="text-muted-foreground"> — {omitido.motivo}</span>
                        </li>
                      ))}
                    </ul>
                    <Button type="button" variant="outline" size="sm" onClick={handleCopiarOmitidos}>
                      Copiar lista de omitidos
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetEstado}>
                Importar otro archivo
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}