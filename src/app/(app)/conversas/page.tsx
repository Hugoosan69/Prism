import Link from "next/link"
import { Mail, MessageCircle, Plug, Settings } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { createClient } from "@/lib/supabase/server"
import type { Integration } from "@/lib/types"

export const dynamic = "force-dynamic"

const STATUS_TONE: Record<string, string> = {
  connected: "bg-success/15 text-success",
  pending: "bg-warning/15 text-warning",
  error: "bg-destructive/15 text-destructive",
  disconnected: "bg-muted text-muted-foreground",
}
const STATUS_LABEL: Record<string, string> = {
  connected: "Conectado",
  pending: "Aguardando",
  error: "Erro",
  disconnected: "Desconectado",
}

export default async function ConversasPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("integrations")
    .select("*")
    .in("type", ["waha", "gmail"])
    .order("created_at")
  const integrations = (data ?? []) as Integration[]
  const connected = integrations.filter((i) => i.status === "connected")

  return (
    <div>
      <PageHeader title="Conversas" />

      {integrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Plug className="size-6 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold tracking-tight">
            Nenhuma conversa conectada
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Conecte o WhatsApp (QR) ou uma conta do Gmail em Configurações para
            que as demandas que chegam por mensagem apareçam aqui.
          </p>
          <Link
            href="/configuracoes"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
          >
            <Settings className="size-4" />
            Abrir Configurações
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {integrations.map((i) => {
              const cfg = (i.config ?? {}) as Record<string, string>
              const Icon = i.type === "gmail" ? Mail : MessageCircle
              const subtitle =
                i.type === "gmail"
                  ? cfg.email || "Sem conta conectada"
                  : `sessão ${cfg.session || "prism"}`
              return (
                <div
                  key={i.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {subtitle}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      STATUS_TONE[i.status] ?? STATUS_TONE.disconnected
                    }`}
                  >
                    {STATUS_LABEL[i.status] ?? i.status}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="rounded-xl border border-dashed border-border bg-card/40 px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {connected.length > 0
                ? "Conexões prontas. A leitura das mensagens dentro do Prism entra na próxima etapa (ingestão WAHA/Gmail)."
                : "Conclua a conexão em Configurações (QR do WhatsApp ou login do Gmail) para liberar as conversas."}
            </p>
            <Link
              href="/configuracoes"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Settings className="size-4" />
              Gerenciar integrações
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
