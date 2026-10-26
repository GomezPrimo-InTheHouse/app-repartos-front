import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RequireRole } from '@/routes/RequireRole'
import { RequirePermiso } from '@/routes/RequirePermiso'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { ProductosPage } from '@/pages/ProductosPage'
import { DespachosPage } from '@/pages/DespachosPage'
import { PagosPage } from '@/pages/PagosPage'
import { ReportesPage } from '@/pages/ReportesPage'
import { RepartoPage } from '@/pages/RepartoPage'
import { ProduccionPage } from '@/pages/ProduccionPage'
import { EmpleadosPage } from '@/pages/EmpleadosPage'
import { SinAccesoPage } from '@/pages/SinAccesoPage'
import { AdminUsuariosPage } from '@/pages/admin/AdminUsuariosPage'
import { AdminPropietariosPage } from '@/pages/admin/AdminPropietariosPage'

// Carga diferida: el mapa (Leaflet) solo se descarga al entrar a esta pantalla.
const GeolocalizacionPage = lazy(() => import('@/pages/GeolocalizacionPage'))

function CargandoPagina() {
  return <p className="p-8 text-center text-sm text-muted-foreground">Cargando…</p>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/sin-acceso" element={<SinAccesoPage />} />

          <Route element={<RequireRole roles={['super_admin']} />}>
            <Route path="/admin" element={<AdminUsuariosPage />} />
            <Route path="/admin/propietarios" element={<AdminPropietariosPage />} />
          </Route>

          <Route element={<RequireRole roles={['admin', 'vendedor']} />}>
            <Route element={<RequirePermiso permiso="dashboard" />}>
              <Route path="/" element={<DashboardPage />} />
            </Route>
            <Route element={<RequirePermiso permiso="clientes" />}>
              <Route path="/clientes" element={<ClientesPage />} />
            </Route>
            <Route element={<RequirePermiso permiso="productos" />}>
              <Route path="/productos" element={<ProductosPage />} />
            </Route>
            <Route element={<RequirePermiso permiso="despachos" />}>
              <Route path="/despachos" element={<DespachosPage />} />
            </Route>
            <Route element={<RequirePermiso permiso="pagos" />}>
              <Route path="/pagos" element={<PagosPage />} />
            </Route>
            <Route element={<RequirePermiso permiso="reportes" />}>
              <Route path="/reportes" element={<ReportesPage />} />
            </Route>
            <Route element={<RequirePermiso permiso="reparto" />}>
              <Route path="/reparto" element={<RepartoPage />} />
            </Route>
            {/* tienePermiso('produccion') ya devuelve false si la empresa no tiene el módulo activo */}
            <Route element={<RequirePermiso permiso="produccion" />}>
              <Route path="/produccion" element={<ProduccionPage />} />
            </Route>
            {/* tienePermiso('geolocalizacion') devuelve false si la empresa no tiene el módulo activo */}
            <Route element={<RequirePermiso permiso="geolocalizacion" />}>
              <Route
                path="/geolocalizacion"
                element={
                  <Suspense fallback={<CargandoPagina />}>
                    <GeolocalizacionPage />
                  </Suspense>
                }
              />
            </Route>
          </Route>

          <Route element={<RequireRole roles={['admin']} />}>
            {/* Mi equipo es contratable: sin el módulo, la empresa opera solo con su administrador */}
            <Route element={<RequirePermiso permiso="equipo" />}>
              <Route path="/empleados" element={<EmpleadosPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}