import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/api/client'

export function LoginPage() {
  const { login, isLoggingIn, isAuthenticated, isLoadingSession } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState(null)

  if (!isLoadingSession && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    try {
      // Se normaliza acá, justo antes de enviar, en vez de en cada
      // onChange — así el usuario ve en pantalla exactamente lo que
      // escribió, pero lo que viaja al backend ya está limpio de
      // mayúsculas/espacios que a veces agrega el teclado predictivo
      // (sobre todo en iOS).
      await login({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Email o clave incorrectos'))
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl font-semibold">Cuaderno</p>
          <p className="text-sm text-muted-foreground">Gestión de logística</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Ingresá con el email y la clave de tu negocio.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@negocio.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Clave</Label>
                {/* relative + pr-9 en el input: el ícono queda flotando
                    adentro del campo, a la derecha, sin robarle ancho al
                    resto del form. type="button" en el toggle evita que
                    dispare el submit del form. */}
                <div className="relative">
                  <Input
                    id="password"
                    type={mostrarPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu clave"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={mostrarPassword ? 'Ocultar clave' : 'Mostrar clave'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {mostrarPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" disabled={isLoggingIn} className="mt-2">
                {isLoggingIn ? 'Ingresando…' : 'Ingresar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}