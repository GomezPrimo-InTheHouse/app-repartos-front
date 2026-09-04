# Cuaderno — Frontend

Frontend en React 19 + Vite para el sistema de gestión de clientes, productos
y cuentas corrientes (venta a crédito / fiado) para negocios de reparto.

## Stack

- **React 19** + **Vite**
- **React Router** para navegación
- **TanStack Query** para estado de servidor (cache, invalidación, reintentos)
- **Axios** como cliente HTTP (`withCredentials: true` — la sesión viaja por cookie httpOnly)
- **Tailwind CSS v4** + componentes propios estilo shadcn/ui (Radix UI + CVA)
- **Sonner** para notificaciones

## Setup

```bash
npm install
cp .env.example .env   # ajustar VITE_API_URL si el backend no corre en localhost:4000/api
npm run dev
```

## Estructura

```
src/
  api/            # funciones que llaman a la API (una por recurso)
  components/
    ui/           # componentes base (Button, Input, Card, Sheet, etc.)
    layout/       # AppShell, PageHeader, navegación
  context/        # AuthContext (sesión global)
  hooks/          # hooks compartidos (useAuth, y los que se sumen)
  pages/          # una página por ruta
  routes/         # ProtectedRoute y lógica de ruteo
  lib/            # utils.js (cn), format.js (moneda/fecha)
```

## Estado actual

- ✅ Login + sesión (`AuthContext`, `GET /auth/me` al arrancar, interceptor de 401)
- ✅ Layout responsive: sidebar en desktop, bottom nav + menú "Más" en mobile
- ✅ Dashboard conectado a `/dashboard/resumen` y `/dashboard/clientes-comprometidos`
- ⏳ Clientes, Productos, Despachos, Pagos, Reportes — placeholders, se construyen a continuación
