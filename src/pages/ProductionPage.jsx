import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/api/client'
import { fetchProduccion, registrarProduccion } from '@/api/produccion'
import { fetchProductos } from '@/api/productos'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberStepper } from '@/components/ui/number-stepper'
import { RecordCard } from '@/components/ui/record-card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const POR_PAGINA = 8

const TIPOS = [
  { value: 'fabricacion', label: 'Fabricación', badge: 'success', signo: '+' },
  { value: 'ajuste_positivo', label: 'Ajuste +', badge: 'default', signo: '+' },
  { value: 'ajuste_negativo', label: 'Ajuste −', badge: 'warning', signo: '−' },
]
const TIPO_POR_VALOR = Object.fromEntries(TIPOS.map((t) => [t.value, t]))

// "Hoy" del navegador en formato YYYY-MM-DD (en-CA da ese formato directo).
function hoyLocal() {
  return new Date().toLocaleDateString('en-CA')
}

// produccion.fecha es tipo date: viene como 'YYYY-MM-DD' o como ISO a medianoche UTC.
// Se toma la parte de la fecha tal cual, sin pasar por new Date(), para que no se corra un día en ART.
function formatFechaSolo(valor) {
  if (!valor) return '—'
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

function formatCantidad(valor) {
  return Number(valor ?? 0).toLocaleString('es-AR')
}

const formInicial = () => ({
  productoId: '',
  tipo: 'fabricacion',
  cantidad: '1',
  fecha: hoyLocal(),
  notas: '',
})

function RegistrarProduccionDialog({ productos }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(formInicial)
  const queryClient = useQueryClient()

  function handleOpenChange(nextOpen) {
    if (nextOpen) setForm(formInicial())
    setOpen(nextOpen)
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const productoElegido = productos?.find((p) => p.id === form.productoId)

  const mutation = useMutation({
    mutationFn: () =>
      registrarProduccion({
        producto_id: form.productoId,
        tipo: form.tipo,
        cantidad: Number(form.cantidad),
        fecha: form.fecha || undefined,
        notas: form.notas.trim() || undefined,
      }),
    onSuccess: ({ producto }) => {
      toast.success(`Registrado. Stock de ${producto.nombre}: ${formatCantidad(producto.stock_actual)}`)
      queryClient.invalidateQueries({ queryKey: ['produccion'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setOpen(false)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar'))
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.productoId) {
      toast.error('Elegí un producto')
      return
    }
    if (!(Number(form.cantidad) > 0)) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Registrar</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar producción</DialogTitle>
          <DialogDescription>
            Fabricación y ajustes suman o restan del stock del producto al instante.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-producto">Producto</Label>
            <Select value={form.productoId} onValueChange={(v) => updateField('productoId', v)}>
              <SelectTrigger id="prod-producto">
                <SelectValue placeholder="Elegí un producto…" />
              </SelectTrigger>
              <SelectContent>
                {productos?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {productoElegido && (
              <p className="text-xs text-muted-foreground">
                Stock actual: <span className="font-mono-num">{formatCantidad(productoElegido.stock_actual)}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label id="prod-tipo-label">Tipo</Label>
            <div role="group" aria-labelledby="prod-tipo-label" className="grid grid-cols-3 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={form.tipo === t.value}
                  onClick={() => updateField('tipo', t.value)}
                  className={cn(
                    'h-11 rounded-md border px-2 text-sm font-medium transition-colors md:h-10',
                    form.tipo === t.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background text-foreground hover:bg-muted'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {form.tipo === 'ajuste_negativo' && (
              <p className="text-xs text-muted-foreground">Resta stock (roturas, mermas, correcciones).</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-cantidad">Cantidad</Label>
              <NumberStepper
                id="prod-cantidad"
                min={1}
                value={form.cantidad}
                onChange={(v) => updateField('cantidad', v)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-fecha">Fecha</Label>
              <Input id="prod-fecha" type="date" value={form.fecha}
                onChange={(e) => updateField('fecha', e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-notas">Notas</Label>
            <Textarea id="prod-notas" value={form.notas} placeholder="Opcional"
              onChange={(e) => updateField('notas', e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Resumen({ label, valor, signo }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border bg-card px-3 py-2">
      <span className="text-[11px] leading-tight text-muted-foreground">{label}</span>
      <span className="font-mono-num text-lg font-semibold leading-tight">
        {signo}{formatCantidad(valor)}
      </span>
    </div>
  )
}

export function ProduccionPage() {
  const [productoId, setProductoId] = useState('todos')
  const [tipo, setTipo] = useState('todos')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(0)

  const { data: productos } = useQuery({
    queryKey: ['productos', { activo: true, paraSelector: true }],
    queryFn: () => fetchProductos({ activo: true }),
  })

  const filtros = {
    productoId: productoId !== 'todos' ? productoId : undefined,
    tipo: tipo !== 'todos' ? tipo : undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
    limit: POR_PAGINA,
    offset: pagina * POR_PAGINA,
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['produccion', filtros],
    queryFn: () => fetchProduccion(filtros),
  })

  const registros = data?.registros ?? []
  const total = data?.total ?? 0
  const totales = data?.totales
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  function actualizarFiltro(setter) {
    return (value) => {
      setter(value)
      setPagina(0)
    }
  }

  return (
    <>
      <PageHeader
        title="Producción"
        description="Fabricación, ajustes y stock de productos"
        actions={<RegistrarProduccionDialog productos={productos} />}
      />
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {/* Stock actual por producto */}
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Stock actual</h2>
          {productos?.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay productos activos.</p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {productos?.map((p) => {
              const bajo = p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo
              return (
                <div key={p.id} className="flex flex-col gap-0.5 rounded-md border border-border bg-card px-3 py-2">
                  <span className="truncate text-xs text-muted-foreground" title={p.nombre}>{p.nombre}</span>
                  <span className={cn('font-mono-num text-lg font-semibold leading-tight', bajo && 'text-destructive')}>
                    {formatCantidad(p.stock_actual)}
                  </span>
                  {bajo && <span className="text-[11px] text-destructive">Bajo el mínimo ({formatCantidad(p.stock_minimo)})</span>}
                </div>
              )
            })}
          </div>
        </section>

        {/* Filtros */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Movimientos</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Select value={productoId} onValueChange={actualizarFiltro(setProductoId)}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Producto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los productos</SelectItem>
                {productos?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tipo} onValueChange={actualizarFiltro(setTipo)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <Input type="date" aria-label="Desde" value={desde}
                onChange={(e) => actualizarFiltro(setDesde)(e.target.value)} className="sm:w-40" />
              <Input type="date" aria-label="Hasta" value={hasta}
                onChange={(e) => actualizarFiltro(setHasta)(e.target.value)} className="sm:w-40" />
            </div>
          </div>

          {/* Totales del período filtrado (ignoran el filtro de tipo) */}
          {totales && (
            <div className="grid grid-cols-3 gap-2">
              <Resumen label="Fabricado" valor={totales.fabricado} signo="+" />
              <Resumen label="Ajustes +" valor={totales.ajustes_positivos} signo="+" />
              <Resumen label="Ajustes −" valor={totales.ajustes_negativos} signo="−" />
            </div>
          )}
        </section>

        {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>}
        {isError && (
          <p className="py-8 text-center text-sm text-destructive">No se pudieron cargar los movimientos.</p>
        )}
        {!isLoading && !isError && registros.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay movimientos que coincidan con los filtros.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {registros.map((r) => {
            const t = TIPO_POR_VALOR[r.tipo]
            return (
              <RecordCard
                key={r.id}
                title={r.producto_nombre}
                badge={<Badge variant={t?.badge ?? 'default'}>{t?.label ?? r.tipo}</Badge>}
                fields={[
                  { label: 'Cantidad', value: `${t?.signo ?? ''}${formatCantidad(r.cantidad)}` },
                  { label: 'Fecha', value: formatFechaSolo(r.fecha) },
                  { label: 'Notas', value: r.notas || '—' },
                ]}
              />
            )
          })}
        </div>

        {total > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {registros.length} de {total}
            </p>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <Button type="button" variant="outline" size="sm" disabled={pagina === 0}
                onClick={() => setPagina((p) => p - 1)}>
                <ChevronLeft className="size-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {pagina + 1} de {totalPaginas}
              </span>
              <Button type="button" variant="outline" size="sm" disabled={pagina + 1 >= totalPaginas}
                onClick={() => setPagina((p) => p + 1)}>
                Siguiente
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}