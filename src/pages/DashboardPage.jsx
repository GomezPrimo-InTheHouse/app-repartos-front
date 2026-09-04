import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { fetchClientesComprometidos, fetchResumen } from '@/api/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatCurrency } from '@/lib/format'

export function DashboardPage() {
  const resumenQuery = useQuery({ queryKey: ['dashboard', 'resumen'], queryFn: fetchResumen })
  const comprometidosQuery = useQuery({
    queryKey: ['dashboard', 'clientes-comprometidos', { limit: 5 }],
    queryFn: () => fetchClientesComprometidos({ limit: 5 }),
  })

  return (
    <>
      <PageHeader title="Inicio" description="Resumen general del negocio" />

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <StatCard
          label="Total ganado"
          value={resumenQuery.data?.totalGanado}
          isLoading={resumenQuery.isLoading}
          hint="Margen acumulado histórico"
        />
        <StatCard
          label="Total invertido"
          value={resumenQuery.data?.totalInvertido}
          isLoading={resumenQuery.isLoading}
          hint="Compras de stock históricas"
        />
        <StatCard
          label="Me deben"
          value={resumenQuery.data?.totalMeDeben}
          isLoading={resumenQuery.isLoading}
          hint="Saldo pendiente a hoy"
          variant="warning"
        />
        <StatCard
          label="Cobrado este mes"
          value={resumenQuery.data?.totalPagadoMes}
          isLoading={resumenQuery.isLoading}
          hint="Pagos del mes calendario"
          variant="success"
        />
      </div>

      <div className="px-4 pb-8 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Clientes más comprometidos</CardTitle>
          </CardHeader>
          <CardContent>
            {comprometidosQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            )}

            {comprometidosQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ningún cliente tiene saldo pendiente por ahora.
              </p>
            )}

            <ul className="divide-y divide-border">
              {comprometidosQuery.data?.map((cliente) => (
                <li key={cliente.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{cliente.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Límite: {cliente.limite_credito > 0 ? formatCurrency(cliente.limite_credito) : 'sin límite'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {cliente.limite_credito > 0 && cliente.saldo > cliente.limite_credito && (
                      <AlertTriangle className="size-4 text-warning" aria-label="Supera el límite de crédito" />
                    )}
                    <span className="font-mono-num text-sm font-semibold">
                      {formatCurrency(cliente.saldo)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function StatCard({ label, value, isLoading, hint, variant = 'default' }) {
  const valueClass =
    variant === 'warning' ? 'text-warning' : variant === 'success' ? 'text-success' : 'text-foreground'

  return (
    <Card>
      <CardContent className="pt-4 sm:pt-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLoading ? (
          <div className="mt-2 h-8 w-24 animate-pulse rounded bg-secondary" />
        ) : (
          <p className={`font-mono-num mt-1 text-2xl font-semibold ${valueClass}`}>
            {formatCurrency(value)}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}
