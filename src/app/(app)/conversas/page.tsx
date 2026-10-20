import { MessagesSquare } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

// Área preparada. O conteúdo (WhatsApp via WAHA, Gmail) chega nas Fases 1 e 2;
// nesta fase é só a casca, para a navegação já refletir as sete áreas.
export default function ConversasPage() {
  return (
    <div>
      <PageHeader title="Conversas" />
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <MessagesSquare className="size-6 text-muted-foreground" />
        </div>
        <h2 className="text-base font-semibold tracking-tight">
          Em breve
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Aqui vão morar as conversas de WhatsApp e e-mail — cada demanda que
          chega vira card e nada se perde. A conexão é configurada em
          Configurações quando as integrações forem ligadas.
        </p>
      </div>
    </div>
  )
}
