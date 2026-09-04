import {
  Building2,
  FileBarChart,
  LayoutDashboard,
  Package,
  Truck,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react'

// "primary" son los ítems que van en el bottom nav mobile (máximo usable sin
// que se apriete: 4-5). "secondary" va agrupado bajo el menú "Más" en mobile,
// pero en el sidebar de desktop se muestran todos juntos sin distinción.

const operativoPrimary = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/despachos', label: 'Despachos', icon: Truck },
  { to: '/pagos', label: 'Pagos', icon: Wallet },
]

const operativoSecondary = [
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/reportes', label: 'Reportes', icon: FileBarChart },
]

const miEquipoItem = { to: '/empleados', label: 'Mi equipo', icon: UserCog }

const superAdminPrimary = [
  { to: '/admin', label: 'Usuarios', icon: UserCog, end: true },
  { to: '/admin/propietarios', label: 'Empresas', icon: Building2 },
]

/**
 * Devuelve la configuración de navegación para un rol dado.
 *
 * - `all`: lista completa, en el orden a mostrar en el sidebar de desktop.
 * - `primary`: subconjunto para el bottom nav mobile.
 * - `secondary`: el resto, agrupado en el menú "Más" en mobile (puede venir vacío).
 */
export function getNavItems(rol) {
  if (rol === 'super_admin') {
    return { all: superAdminPrimary, primary: superAdminPrimary, secondary: [] }
  }

  if (rol === 'admin') {
    const secondary = [...operativoSecondary, miEquipoItem]
    return { all: [...operativoPrimary, ...secondary], primary: operativoPrimary, secondary }
  }

  // vendedor, o rol todavía no resuelto (sesión cargando): navegación
  // operativa sin "Mi equipo", que es el conjunto más restrictivo y seguro
  // para mostrar mientras no sabemos el rol con certeza.
  return {
    all: [...operativoPrimary, ...operativoSecondary],
    primary: operativoPrimary,
    secondary: operativoSecondary,
  }
}