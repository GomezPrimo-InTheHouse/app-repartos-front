import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Sparkles, Upload, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { confirmarImportacionExcel, previsualizarImportacionExcel } from '@/api/clientes'
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

/**
 * Importación de clientes en 2 pasos:
 * 1. Subir archivo → previsualizarImportacionExcel → candidatos (nada se
 *    guarda todavía).
 * 2. Revisar candidatos (todos tildados por default, el usuario destilda
 *    los que no quiere) → confirmarImportacionExcel → recién ahí se crean.
 *
 * Estados internos: 'subir' → 'revisar' → 'resultado'.
 */
export function ImportarClientesDialog({ trigger }) {
  const [open, setOpen] = useState(false)
  const [paso, setPaso] = useState('subir')
  const [archivo, setArchivo] = useState(null)
  const [previa, setPrevia] = useState(null)
  const [seleccionados, setSeleccionados] = useState({})
  const [resultado, setResultado] = useState(null)
  const queryClient = useQueryClient()

  function resetEstado() {
    setPaso('subir')
    setArchivo(null)
    setPrevia(null)
    setSeleccionados({})
    setResultado(null)
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen) resetEstado()
    setOpen(nextOpen)
  }

  const previsualizarMutation = useMutation({
    mutationFn: () => previsualizarImportacionExcel(archivo),
    onSuccess: (data) => {
      setPrevia(data)
      // Todos tildados por default, tal como se definió.
      setSeleccionados(Object.fromEntries(data.candidatos.map((c) => [c.id, true])))
      setPaso('revisar')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo analizar el archivo'))
    },
  })

  const confirmarMutation = useMutation({
    mutationFn: () => {
      const candidatosAceptados = previa.candidatos.filter((c) => seleccionados[c.id])
      return confirmarImportacionExcel(candidatosAceptados)
    },
    onSuccess: (data) => {
      setResultado(data)
      setPaso('resultado')
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo confirmar la importación'))
    },
  })

  function handleSubmitArchivo(event) {
    event.preventDefault()
    if (!archivo) return
    previsualizarMutation.mutate()
  }

  function toggleSeleccionado(id) {
    setSeleccionados((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleTodos(valor) {
    setSeleccionados(Object.fromEntries(previa.candidatos.map((c) => [c.id, valor])))
  }

  const cantidadSeleccionados = Object.values(seleccionados).filter(Boolean).length
  const totalDivididos =
    previa?.filasDivididas?.reduce((acc, f) => acc + f.clientesGenerados.length, 0) ?? 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {/* --- Paso 1: subir archivo --- */}
        {paso === 'subir' && (
          <>
            <DialogHeader>
              <DialogTitle>Importar clientes desde Excel</DialogTitle>
              <DialogDescription>
                Subí un archivo .xlsx o .xls. Vas a poder revisar los clientes detectados antes de
                que se creen. Máximo 200 filas y 5MB por archivo.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitArchivo} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="archivo-excel">Archivo Excel</Label>
                <Input
                  id="archivo-excel"
                  type="file"
                  accept=".xlsx,.xls"
                  disabled={previsualizarMutation.isPending}
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                />
              </div>

              {previsualizarMutation.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Analizando… puede tardar unos segundos.
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={previsualizarMutation.isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!archivo || previsualizarMutation.isPending}>
                  <Upload className="size-4" />
                  {previsualizarMutation.isPending ? 'Analizando…' : 'Analizar archivo'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {/* --- Paso 2: revisar candidatos, tildar/destildar --- */}
        {paso === 'revisar' && previa && (
          <>
            <DialogHeader>
              <DialogTitle>Revisá antes de confirmar</DialogTitle>
              <DialogDescription>
                Ningún cliente se creó todavía. Destildá los que no quieras cargar.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{previa.totalFilasLeidas} filas leídas</span>
              <Badge variant="outline" className="gap-1">
                {previa.metodoExtraccion === 'deterministico' ? (
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
              {previa.omitidos.length > 0 && (
                <Badge variant="warning">{previa.omitidos.length} omitidos</Badge>
              )}
            </div>

            {totalDivididos > 0 && (
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                Se detectaron {previa.filasDivididas.length} fila(s) con más de un cliente,
                generando {totalDivididos} cliente(s) por separado. Revisalos abajo.
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {cantidadSeleccionados} de {previa.candidatos.length} seleccionados
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => toggleTodos(true)}>
                  Tildar todos
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => toggleTodos(false)}>
                  Destildar todos
                </Button>
              </div>
            </div>

            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-md border border-border p-2">
              {previa.candidatos.map((candidato) => (
                <li key={candidato.id}>
                  <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={Boolean(seleccionados[candidato.id])}
                      onChange={() => toggleSeleccionado(candidato.id)}
                      className="size-4 rounded border-border"
                    />
                    <span className="flex-1">
                      <span className="font-medium">{candidato.nombre}</span>
                      {candidato.direccion && (
                        <span className="text-muted-foreground"> — {candidato.direccion}</span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            {previa.omitidos.length > 0 && (
              <details className="rounded-md border border-border">
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground">
                  Ver {previa.omitidos.length} fila(s) omitida(s)
                </summary>
                <ul className="flex flex-col gap-1 border-t border-border p-2">
                  {previa.omitidos.map((omitido, index) => (
                    <li key={index} className="rounded-md bg-warning-soft px-2 py-1.5 text-xs">
                      <span className="font-medium">{omitido.fila?.nombre ?? 'Sin nombre'}</span>
                      <span className="text-muted-foreground"> — {omitido.motivo}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={confirmarMutation.isPending}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => confirmarMutation.mutate()}
                disabled={cantidadSeleccionados === 0 || confirmarMutation.isPending}
              >
                {confirmarMutation.isPending
                  ? 'Creando…'
                  : `Crear ${cantidadSeleccionados} cliente(s)`}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* --- Paso 3: resultado final --- */}
        {paso === 'resultado' && resultado && (
          <>
            <DialogHeader>
              <DialogTitle>Importación completada</DialogTitle>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="success">{resultado.creados.length} creados</Badge>
              {resultado.omitidos.length > 0 && (
                <Badge variant="warning">{resultado.omitidos.length} omitidos al confirmar</Badge>
              )}
            </div>

            {resultado.omitidos.length > 0 && (
              <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border border-border p-2">
                {resultado.omitidos.map((omitido, index) => (
                  <li key={index} className="rounded-md bg-warning-soft px-2 py-1.5 text-xs">
                    <span className="font-medium">{omitido.fila?.nombre ?? 'Sin nombre'}</span>
                    <span className="text-muted-foreground"> — {omitido.motivo}</span>
                  </li>
                ))}
              </ul>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetEstado}>
                Importar otro archivo
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}