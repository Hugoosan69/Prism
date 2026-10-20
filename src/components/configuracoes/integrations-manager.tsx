"use client"

import { useEffect, useState } from "react"
import { KeyRound, Plug, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import {
  INTEGRATION_STATUS_LABELS,
  INTEGRATION_TYPE_LABELS,
  type Company,
  type Integration,
  type IntegrationStatus,
  type IntegrationType,
} from "@/lib/types"
import { CadastroSection, EmptyRow, StatusPill } from "./cadastro-ui"

const selectCls =
  "h-9 shrink-0 rounded-lg border border-input bg-muted px-2 text-sm outline-none focus-visible:border-ring"
const TYPES = Object.keys(INTEGRATION_TYPE_LABELS) as IntegrationType[]

export function IntegrationsManager() {
  const supabase = createClient()
  const [rows, setRows] = useState<Integration[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [type, setType] = useState<IntegrationType>("waha")
  const [label, setLabel] = useState("")
  const [secrets, setSecrets] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    const [{ data: is }, { data: cs }] = await Promise.all([
      supabase.from("integrations").select("*").order("created_at"),
      supabase.from("companies").select("*").order("name"),
    ])
    setRows(is ?? [])
    setCompanies(cs ?? [])
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add() {
    const { data, error } = await supabase
      .from("integrations")
      .insert({ type, label: label.trim() || INTEGRATION_TYPE_LABELS[type] })
      .select()
      .single()
    if (error || !data) {
      toast.error("Não foi possível criar a integração.")
      return
    }
    setRows((r) => [...r, data])
    setLabel("")
    toast.success("Integração criada.")
  }

  async function patch(id: string, patch: Partial<Integration>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    const { error } = await supabase.from("integrations").update(patch).eq("id", id)
    if (error) toast.error("Não foi possível atualizar.")
  }

  async function saveSecret(id: string) {
    const secret = secrets[id]?.trim()
    if (!secret) return
    setBusy(id)
    const { error } = await supabase.functions.invoke("conectar", {
      body: { action: "salvar-segredo", kind: "integration", id, secret },
    })
    setBusy(null)
    if (error) {
      toast.error("Não foi possível guardar o segredo.")
      return
    }
    setSecrets((s) => ({ ...s, [id]: "" }))
    setRows((r) => r.map((x) => (x.id === id ? { ...x, has_secret: true } : x)))
    toast.success("Segredo guardado com segurança.")
  }

  async function test(id: string) {
    setBusy(id)
    const { data, error } = await supabase.functions.invoke("conectar", {
      body: { action: "testar", kind: "integration", id },
    })
    setBusy(null)
    if (error) {
      toast.error("Falha ao testar a conexão.")
      return
    }
    const status = (data?.status ?? "error") as IntegrationStatus
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)))
    toast[status === "error" ? "error" : "success"](
      data?.message ?? "Teste concluído."
    )
  }

  async function remove(id: string) {
    const { error } = await supabase.from("integrations").delete().eq("id", id)
    if (error) {
      toast.error("Não foi possível excluir.")
      return
    }
    setRows((r) => r.filter((x) => x.id !== id))
    toast.success("Integração removida.")
  }

  return (
    <CadastroSection
      title="Integrações"
      description="WAHA, Gmail, GLPI e Zoho. O segredo vai cifrado para o Vault e nunca volta à tela — só o status."
    >
      {rows.length === 0 && <EmptyRow>Nenhuma integração.</EmptyRow>}
      {rows.map((i) => {
        const cfg = (i.config ?? {}) as Record<string, string>
        return (
          <div key={i.id} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                {INTEGRATION_TYPE_LABELS[i.type as IntegrationType]}
              </span>
              <Input
                defaultValue={i.label}
                onBlur={(e) =>
                  e.target.value !== i.label && patch(i.id, { label: e.target.value })
                }
                className="h-8 flex-1"
                placeholder="Apelido"
              />
              <StatusPill
                status={i.status}
                label={INTEGRATION_STATUS_LABELS[i.status as IntegrationStatus]}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(i.id)}
                aria-label={`Excluir ${i.label}`}
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={selectCls}
                value={i.company_id ?? ""}
                onChange={(e) =>
                  patch(i.id, { company_id: e.target.value || null })
                }
              >
                <option value="">Sem empresa</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Input
                defaultValue={cfg.url ?? ""}
                placeholder="URL (ex.: WAHA, GLPI)"
                className="h-8 flex-1"
                onBlur={(e) =>
                  patch(i.id, { config: { ...cfg, url: e.target.value.trim() } })
                }
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="password"
                placeholder={i.has_secret ? "Segredo configurado ••••" : "API key / token"}
                value={secrets[i.id] ?? ""}
                onChange={(e) =>
                  setSecrets((s) => ({ ...s, [i.id]: e.target.value }))
                }
                className="h-8 flex-1"
                autoComplete="off"
              />
              <Button
                variant="secondary"
                size="sm"
                className="gap-1"
                disabled={busy === i.id || !(secrets[i.id] ?? "").trim()}
                onClick={() => saveSecret(i.id)}
              >
                <KeyRound className="size-3.5" />
                Guardar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={busy === i.id}
                onClick={() => test(i.id)}
              >
                <Plug className="size-3.5" />
                Testar conexão
              </Button>
            </div>
          </div>
        )
      })}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <select
          className={selectCls}
          value={type}
          onChange={(e) => setType(e.target.value as IntegrationType)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {INTEGRATION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <Input
          placeholder="Apelido (opcional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1"
        />
        <Button onClick={add} className="gap-1">
          <Plus className="size-4" />
          Nova integração
        </Button>
      </div>
    </CadastroSection>
  )
}
