import { HistorialTab } from '@/components/reparto/HistorialTab'
import { MisListasTab } from '@/components/reparto/MisListasTab'
import { RepartoHoyTab } from '@/components/reparto/RepartoHoyTab'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function RepartoPage() {
  return (
    <>
      <PageHeader title="Reparto" description="Planificá y registrá el reparto diario" />
      <div className="p-4 sm:p-6">
        <Tabs defaultValue="hoy">
          <TabsList>
            <TabsTrigger value="hoy">Reparto de hoy</TabsTrigger>
            <TabsTrigger value="listas">Mis listas</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="hoy">
            <RepartoHoyTab />
          </TabsContent>
          <TabsContent value="listas">
            <MisListasTab />
          </TabsContent>
          <TabsContent value="historial">
            <HistorialTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}