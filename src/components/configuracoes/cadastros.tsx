"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompaniesManager } from "./companies-manager"
import { SourcesManager } from "./sources-manager"
import { LabelsManager } from "./labels-manager"
import { CommandsManager } from "./commands-manager"
import { IntegrationsManager } from "./integrations-manager"
import { AiModelsManager } from "./ai-models-manager"

/** Os seis cadastros da central de demandas, cada um numa sub-aba. */
export function Cadastros() {
  return (
    <Tabs defaultValue="empresas">
      <TabsList className="flex-wrap">
        <TabsTrigger value="empresas">Empresas</TabsTrigger>
        <TabsTrigger value="origens">Origens</TabsTrigger>
        <TabsTrigger value="etiquetas">Etiquetas</TabsTrigger>
        <TabsTrigger value="comandos">Comandos</TabsTrigger>
        <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        <TabsTrigger value="modelos">Modelos de IA</TabsTrigger>
      </TabsList>
      <TabsContent value="empresas" className="pt-2">
        <CompaniesManager />
      </TabsContent>
      <TabsContent value="origens" className="pt-2">
        <SourcesManager />
      </TabsContent>
      <TabsContent value="etiquetas" className="pt-2">
        <LabelsManager />
      </TabsContent>
      <TabsContent value="comandos" className="pt-2">
        <CommandsManager />
      </TabsContent>
      <TabsContent value="integracoes" className="pt-2">
        <IntegrationsManager />
      </TabsContent>
      <TabsContent value="modelos" className="pt-2">
        <AiModelsManager />
      </TabsContent>
    </Tabs>
  )
}
