# Cuaderno — Frontend

Frontend de **Cuaderno** (app-repartos), un sistema web multi-empresa para negocios de reparto
de soda, agua y dispensers: clientes, despachos a crédito (fiado), pagos, envases retornables,
recorridos de reparto y, opcionalmente, control de stock y producción.

- Producción: <https://app-logistica-nine.vercel.app>
- Backend: repo `app-repartos-back` (Express + Postgres en Supabase), desplegado en Render.

---

## Correr el proyecto en tu máquina

Podés levantar el frontend **sin tener acceso a la base de datos**: el servidor de desarrollo
reenvía las llamadas a la API al backend que ya está desplegado (opción A).

### Requisitos

- **Node.js 20.19+ o 22.12+** (lo exige Vite 8). Verificalo con `node -v`.
- npm (viene con Node).
- **Un usuario de prueba** del sistema (email y contraseña). Pedíselo al responsable del proyecto:
  no hay registro público, los usuarios los crea un administrador.

### Opción A — Contra el backend desplegado (recomendada)

```bash
git clone https://github.com/GomezPrimo-InTheHouse/app-repartos-front.git
cd app-repartos-front
npm install
cp .env.example .env     # en Windows (cmd): copy .env.example .env
npm run dev
```

Abrí <http://localhost:5173> e ingresá con tu usuario de prueba.

El `.env.example` ya viene configurado para esta opción:

```env
VITE_API_URL=/api
VITE_PROXY_TARGET=https://app-repartos-back-s0h3.onrender.com
```

**Cómo funciona:** el front llama a `/api/...` en `localhost` y Vite lo reenvía al backend de
Render (ver `vite.config.js`). Para el navegador todo es el mismo origen, así que la cookie de
sesión (httpOnly) funciona igual que en producción, donde Vercel hace lo mismo con
`vercel.json`.

> **El primer pedido puede tardar ~50 segundos.** El backend está en el plan gratuito de
> Render y se duerme tras un rato sin uso. Si el login "se cuelga" la primera vez, esperá y
> reintentá.

> **Ojo: estás trabajando sobre datos reales del backend desplegado.** Usá siempre un usuario
> de una empresa de prueba, nunca uno de una empresa en uso.

### Opción B — Backend local (requiere base de datos)

Solo si vas a tocar el backend. Necesitás el repo `app-repartos-back` corriendo en
`http://localhost:4000` (`npm install` y `npm run dev`) con su propio `.env`:
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL` y `FRONTEND_URL`. Esas credenciales
dan acceso a la base, así que se piden al responsable del proyecto.

En el `.env` del front comentá las dos líneas de la opción A y dejá:

```env
VITE_API_URL=http://localhost:4000/api
```

En este modo **no** se usa el proxy: el front llama directo al backend, que tiene que tener
`http://localhost:5173` en su variable `FRONTEND_URL` (CORS).

### Probar en el celular

`npm run dev` también expone la app en tu red local (`host: true`). Abrí desde el celular la
URL "Network" que muestra la consola (ej. `http://192.168.0.10:5173`), con el celu en el
mismo WiFi.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de `dist/` para probarlo |
| `npm run lint` | Linter (oxlint) |

---

## Stack

- **React 19** + **Vite 8**
- **React Router 7** para navegación y protección de rutas
- **TanStack Query 5** para estado de servidor (cache, invalidación, reintentos)
- **Axios** como cliente HTTP (`withCredentials: true` — la sesión viaja por cookie httpOnly)
- **Tailwind CSS v4** + componentes propios estilo shadcn/ui (Radix UI + CVA)
- **lucide-react** (íconos) y **Sonner** (notificaciones)

---

## Módulos

| Módulo | Ruta | Qué hace |
|---|---|---|
| Dashboard | `/` | Resumen: ganancia, deuda total, pagos del mes, clientes comprometidos |
| Clientes | `/clientes` | ABM, búsqueda, saldo y envases en su poder, % de aumento, importación desde Excel (con IA) |
| Despachos | `/despachos` | Carrito de productos, devolución de envases, alerta de crédito, anulación, PDF |
| Pagos | `/pagos` | Registro y anulación de pagos, comprobante PDF |
| Productos | `/productos` | Catálogo, precio y costo, si maneja envase retornable |
| Reparto | `/reparto` | Listas semanales (uno o varios días) o únicas, reparto del día, historial |
| Reportes | `/reportes` | PDF de estado de cuenta por cliente y resumen general |
| Producción | `/produccion` | Stock, fabricación y ajustes. **Opcional por empresa** (ver abajo) |
| Mi equipo | `/empleados` | Alta de empleados, permisos por módulo, reseteo de contraseña (solo admin) |
| Empresas / Usuarios | `/admin/...` | Panel del super admin: empresas, módulos opcionales, usuarios |

### Roles y permisos

- **super_admin**: solo ve el panel `/admin` (empresas y usuarios). No opera ninguna empresa.
- **admin**: dueño de una empresa. Acceso a todos los módulos de su empresa + Mi equipo.
- **vendedor**: empleado. Solo ve los módulos que el admin le habilitó en Mi equipo.

Cada empresa ve únicamente sus propios datos (multi-tenant): el backend filtra todo por la
empresa del usuario logueado.

### Módulo Producción (opcional)

Lo activa el super admin por empresa (**Empresas → Producción → Activar**). Mientras está
apagado, el sistema funciona sin control de stock y el módulo no aparece para nadie.

Con el módulo activo:

- Cada despacho descuenta stock y se rechaza si no alcanza; anularlo lo repone.
- En **Producción** se registra la fabricación y los ajustes (+/−), y se ve el stock actual.
- Los productos arrancan con stock 0: cargá un **Ajuste +** inicial antes de despachar.

---

## Estructura

```
src/
  api/              # una función por endpoint, agrupadas por recurso (clientes.js, despachos.js, …)
  components/
    ui/             # componentes base: Button, Input, Select, Dialog, Sheet, RecordCard,
                    #   ConfirmDialog, NumberStepper, …
    layout/         # AppShell, PageHeader, nav-items (menú según rol y permisos)
    clientes/ despachos/ pagos/ productos/ reparto/ empleados/ admin/
                    # componentes propios de cada módulo (diálogos, formularios, tabs)
  config/
    features.js     # flags para prender/apagar funcionalidades sin tocar el resto
  context/          # AuthContext: sesión, rol, tienePermiso()
  hooks/            # useAuth, useDebouncedValue
  lib/              # utils.js (cn), format.js (moneda/fecha), navHome.js (home según permisos)
  pages/            # una página por ruta (admin/ para el panel del super admin)
  routes/           # ProtectedRoute, RequireRole, RequirePermiso
```

### Convenciones

- **Listados en cards** (`RecordCard`), no tablas. Paginación de **8 por página**, hecha en el backend.
- **Ediciones con confirmación** (`ConfirmDialog`); las altas no la piden.
- **Montos y fechas** siempre con `formatCurrency` / `formatDate` de `lib/format.js`.
- **Funcionalidades experimentales** detrás de un flag en `config/features.js`.
- **Mobile first**: todo tiene que usarse cómodo en el celular (lo usa el repartidor en la calle).

---

## Deploy

- **Vercel**, desde la rama `main`. No necesita variables de entorno: en producción el front
  llama a `/api` y `vercel.json` lo reenvía al backend de Render.
- Las migraciones de base de datos viven en el repo del backend (`migrations/`) y se aplican a
  mano en Supabase **antes** de desplegar el código que las usa.