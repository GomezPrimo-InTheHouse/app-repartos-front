import { PageHeader } from '@/components/layout/PageHeader'
import { MapaClientesTab } from '@/components/geolocalizacion/MapaClientesTab'
import { MapaRepartidoresTab } from '@/components/geolocalizacion/MapaRepartidoresTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'

// Se carga aparte (lazy en App.jsx): Leaflet solo se descarga al entrar a esta pantalla.
export default function GeolocalizacionPage() {
  const { isAdmin } = useAuth()

  return (
    <>
      <PageHeader title="Geolocalización" description="Clientes y repartidores en el mapa" />
      <div className="p-4 sm:p-6">
        {isAdmin ? (
          <Tabs defaultValue="clientes">
            <TabsList>
              <TabsTrigger value="clientes">Clientes</TabsTrigger>
              <TabsTrigger value="repartidores">Repartidores</TabsTrigger>
            </TabsList>
            <TabsContent value="clientes">
              <MapaClientesTab />
            </TabsContent>
            <TabsContent value="repartidores">
              <MapaRepartidoresTab />
            </TabsContent>
          </Tabs>
        ) : (
          // El vendedor con el módulo habilitado ve solo el mapa de clientes.
          <MapaClientesTab />
        )}
      </div>
    </>
  )
}