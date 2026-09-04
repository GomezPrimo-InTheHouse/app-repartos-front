export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-background px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}
