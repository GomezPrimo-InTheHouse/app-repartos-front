import { PageHeader } from './PageHeader'

export function EnConstruccion({ title, description }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <p className="font-display text-lg font-medium text-muted-foreground">
          Este módulo se construye en el próximo paso
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          El login, la navegación y el dashboard ya están funcionando. Seguimos con este módulo
          cuando quieras.
        </p>
      </div>
    </>
  )
}
