import { LogOut, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { getNavItems } from './nav-items'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export function AppShell() {
  return (
    <div className="min-h-dvh md:flex">
      <DesktopSidebar />
      <div className="flex min-h-dvh flex-1 flex-col">
        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </div>
  )
}

function DesktopSidebar() {
  const { user, rol, tienePermiso, logout } = useAuth()
  const { all } = getNavItems(rol, tienePermiso)

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex min-h-[89px] flex-col justify-center border-b border-border p-5">
        <p className="font-display text-xl font-semibold">Cuaderno</p>
        <p className="text-xs text-muted-foreground">Gestión de Logística</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {all.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium">{user?.nombreCompleto}</p>
          <p className="truncate text-xs capitalize text-muted-foreground">{rol}</p>
        </div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ item }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-foreground hover:bg-secondary'
        )
      }
    >
      <Icon className="size-4" />
      {item.label}
    </NavLink>
  )
}

function MobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const { rol, tienePermiso, logout } = useAuth()
  const { primary, secondary } = getNavItems(rol, tienePermiso)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-card md:hidden">
      {primary.map((item) => (
        <BottomNavLink key={item.to} item={item} />
      ))}

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger asChild>
          <button className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
            <MoreHorizontal className="size-5" />
            Más
          </button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Más opciones</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1">
            {secondary.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium',
                      isActive ? 'bg-secondary' : 'hover:bg-secondary'
                    )
                  }
                >
                  <Icon className="size-5" />
                  {item.label}
                </NavLink>
              )
            })}
            <button
              onClick={() => logout()}
              className="mt-2 flex items-center gap-3 rounded-md border-t border-border px-3 py-3 text-base font-medium text-destructive"
            >
              <LogOut className="size-5" />
              Cerrar sesión
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}

function BottomNavLink({ item }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )
      }
    >
      <Icon className="size-5" />
      {item.label}
    </NavLink>
  )
}