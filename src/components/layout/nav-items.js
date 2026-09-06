import {
  Building2, FileBarChart, LayoutDashboard, Navigation, Package, Truck, UserCog, Users, Wallet,
} from 'lucide-react'

const operativoPrimary = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true, permiso: 'dashboard' },
  { to: '/clientes', label: 'Clientes', icon: Users, permiso: 'clientes' },
  { to: '/despachos', label: 'Despachos', icon: Truck, permiso: 'despachos' },
  { to: '/pagos', label: 'Pagos', icon: Wallet, permiso: 'pagos' },
]

const operativoSecondary = [
  { to: '/productos', label: 'Productos', icon: Package, permiso: 'productos' },
  { to: '/reportes', label: 'Reportes', icon: FileBarChart, permiso: 'reportes' },
  { to: '/reparto', label: 'Reparto', icon: Navigation, permiso: 'reparto' },
]

const miEquipoItem = { to: '/empleados', label: 'Mi equipo', icon: UserCog, permiso: null }

const superAdminPrimary = [
  { to: '/admin', label: 'Usuarios', icon: UserCog, end: true, permiso: null },
  { to: '/admin/propietarios', label: 'Empresas', icon: Building2, permiso: null },
]

export function getNavItems(rol, tienePermiso = () => true) {
  if (rol === 'super_admin') {
    return { all: superAdminPrimary, primary: superAdminPrimary, secondary: [] }
  }

  function filtrarPorPermiso(items) {
    return items.filter((item) => item.permiso === null || tienePermiso(item.permiso))
  }

  if (rol === 'admin') {
    const secondary = filtrarPorPermiso([...operativoSecondary, miEquipoItem])
    const primary = filtrarPorPermiso(operativoPrimary)
    return { all: [...primary, ...secondary], primary, secondary }
  }

  // vendedor
  const primary = filtrarPorPermiso(operativoPrimary)
  const secondary = filtrarPorPermiso(operativoSecondary)
  return { all: [...primary, ...secondary], primary, secondary }
}