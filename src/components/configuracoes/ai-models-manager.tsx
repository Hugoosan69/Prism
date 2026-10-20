"use client"

import { useEffect, useState } from "react"
import { KeyRound, Plug, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import {
  AI_SURFACE_LABELS,
  type AiAssignment,
  type AiModel,
  type AiSurface,
} from "@/lib/types"
import { CadastroSection, EmptyRow, StatusPill } from "./cadastro-ui"

const selectCls =
  "h-9 shrink-0 rounded-lg border border-input bg-muted px-2 text-sm outline-none focus-visible:border-ring"
const SURFACES = Object.keys(AI_SURFACE_LABELS) as AiSurface[]
const STATUS_LABELS: Record<string, string> = {
  untested: "Não testado",
  ok: "OK",
  error: "Erro",
}

export function AiModelsManager() {
  const supabase = createClient()
  const [rows, setRows] = useState<AiModel[]>([])
  const [assign, setAssign] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    label: "",
    model: "",
    base_url: "https://api.openai.com/v1",
    dialect: "openai",
  })
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    const [{ data: ms }, { data: as }] = await Promise.all([
      supabase.from("ai_models").select("*").order("created_at"),
      supabase.from("ai_assignments").select("*"),
    ])
    setRows(ms ?? [])
    const map: Record<string, string> = {}
    for (const a of (as ?? []) as AiAssignment[])
      if (a.model_id) map[a.surface] = a.model_id
    setAssign(map)
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add() {
    if (!form.label.trim() || !form.model.trim() || !form.base_url.trim()) return
    const { data, error } = await supabase
      .from("ai_models")
      .insert({
        label: form.label.trim(),
        model: form.model.trim(),
        base_url: form.base_url.trim(),
        dialect: form.dialect.trim() || "openai",
      })
      .select()
      .single()
    if (error || !data) {
      toast.error("Não foi possível salvar o modelo.")
      return
    }
    setRows((r) => [...r, data])
    setForm({ label: "", model: "", base_url: "https://api.openai.com/v1", dialect: "openai" })
    toast.success("Modelo adicionado.")
  }

  async function patch(id: string, patch: Partial<AiModel>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    const { error } = await supabase.from("ai_models").update(patch).eq("id", id)
    if (error) toast.error("Não foi possível atualizar.")
  }

  async function saveKey(id: string) {
    const secret = keys[id]?.trim()
    if (!secret) return
    setBusy(id)
    const { error } = await supabase.functions.invoke("conectar", {
      body: { action: "salvar-segredo", kind: "model", id, secret },
    })
    setBusy(null)
    if (error) {
      toast.error("Não foi possível guardar a chave.")
      return
    }
    setKeys((k) => ({ ...k, [id]: "" }))
    setRows((r) => r.map((x) => (x.id === id ? { ...x, has_key: true } : x)))
    toast.success("Chave guardada com segurança.")
  }

  async function test(id: string) {
    setBusy(id)
    const { data, error } = await supabase.functions.invoke("conectar", {
      body: { action: "testar", kind: "model", id },
    })
    setBusy(null)
    if (error) {
      toast.error("Falha ao testar o modelo.")
      return
    }
    const status = (data?.status ?? "error") as string
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)))
    toast[status === "error" ? "error" : "success"](data?.message ?? "Teste concluído.")
  }

  async function remove(id: string) {
    const { error } = await supabase.from("ai_models").delete().eq("id", id)
    if (error) {
      toast.error("Não foi possível excluir.")
      return
    }
    setRows((r) => r.filter((x) => x.id !== id))
    toast.success("Modelo removido.")
  }

  async function setAssignment(surface: AiSurface, modelId: string) {
    setAssign((a) => ({ ...a, [surface]: modelId }))
    const { error } = await supabase
      .from("ai_assignments")
      .upsert({ surface, model_id: modelId || null }, { onConflict: "surface" })
    if (error) toast.error("Não foi possível atribuir.")
    else toast.success("Atribuição salva.")
  }

  return (
    <CadastroSection
      title="Modelos de IA"
      description="Um modelo por superfície. A chave vai cifrada para o Vault; a tela só vê o status. Sem atribuição, o chat usa o padrão de fábrica."
    >
      {rows.length === 0 && <EmptyRow>Nenhum modelo.</EmptyRow>}
      {rows.map((m) => (
        <div key={m.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              defaultValue={m.label}
              placeholder="Apelido"
              className="h-8 w-32 shrink-0"
              onBlur={(e) =>
                e.target.value !== m.label && patch(m.id, { label: e.target.value })
              }
            />
            <Input
              defaultValue={m.model}
              placeholder="modelo (ex.: gpt-4.1-mini)"
              className="h-8 flex-1 font-mono"
              onBlur={(e) =>
                e.target.value !== m.model && patch(m.id, { model: e.target.value })
              }
            />
            <StatusPill status={m.status} label={STATUS_LABELS[m.status] ?? m.status} />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(m.id)}
              aria-label={`Excluir ${m.label}`}
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              defaultValue={m.base_url}
              placeholder="base_url"
              className="h-8 flex-1 font-mono"
              onBlur={(e) =>
                e.target.value !== m.base_url &&
                patch(m.id, { base_url: e.target.value.trim() })
              }
            />
            <Input
              defaultValue={m.dialect}
              placeholder="dialeto"
              className="h-8 w-28 shrink-0 font-mono"
              onBlur={(e) =>
                e.target.value !== m.dialect &&
                patch(m.id, { dialect: e.target.value.trim() || "openai" })
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="password"
              placeholder={m.has_key ? "Chave configurada ••••" : "API key"}
              value={keys[m.id] ?? ""}
              onChange={(e) => setKeys((k) => ({ ...k, [m.id]: e.target.value }))}
              className="h-8 flex-1"
              autoComplete="off"
            />
            <Button
              variant="secondary"
              size="sm"
              className="gap-1"
              disabled={busy === m.id || !(keys[m.id] ?? "").trim()}
              onClick={() => saveKey(m.id)}
            >
              <KeyRound className="size-3.5" />
              Guardar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={busy === m.id}
              onClick={() => test(m.id)}
            >
              <Plug className="size-3.5" />
              Testar
            </Button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Input
          placeholder="Apelido"
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          className="w-32 shrink-0"
        />
        <Input
          placeholder="modelo"
          value={form.model}
          onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          className="flex-1 font-mono"
        />
        <Input
          placeholder="base_url"
          value={form.base_url}
          onChange={(e) => setForm((f) => ({ ...f, base_url: e.target.value }))}
          className="flex-1 font-mono"
        />
        <Button onClick={add} className="gap-1">
          <Plus className="size-4" />
          Adicionar
        </Button>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground">
          Modelo por superfície
        </p>
        {SURFACES.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-sm">{AI_SURFACE_LABELS[s]}</span>
            <select
              className={`${selectCls} flex-1`}
              value={assign[s] ?? ""}
              onChange={(e) => setAssignment(s, e.target.value)}
            >
              <option value="">Padrão de fábrica</option>
              {rows.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </CadastroSection>
  )
}
