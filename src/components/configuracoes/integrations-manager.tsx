"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { KeyRound, Loader2, Plug, Plus, QrCode, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  // Diálogo de QR do WhatsApp.
  const [qrFor, setQrFor] = useState<string | null>(null)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const [{ data: is }, { data: cs }] = await Promise.all([
      supabase.from("integrations").select("*").order("created_at"),
      supabase.from("companies").select("*").order("name"),
    ])
    setRows(is ?? [])
    setCompanies(cs ?? [])
  }, [supabase])

  useEffect(() => {
    load()
  }, [load])

  // Retorno do OAuth do Gmail (?gmail=ok|erro|...).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("gmail")
    if (!p) return
    if (p === "ok") toast.success("Conta Google conectada.")
    else if (p === "sem_token")
      toast.error("O Google não devolveu o refresh token. Revogue o acesso e tente de novo.")
    else if (p === "sem_app")
      toast.error("Configure o app OAuth do Google (aba Cofre) antes.")
    else toast.error("Falha ao conectar o Gmail.")
    window.history.replaceState({}, "", "/configuracoes")
    load()
  }, [load])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
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
    toast[status === "error" ? "error" : "success"](data?.message ?? "Teste concluído.")
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

  function connectGmail(id: string) {
    window.location.href = `/api/integrations/gmail/start?id=${id}`
  }

  function stopPoll() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }

  async function openQr(id: string) {
    setQrFor(id)
    setQrImage(null)
    setBusy(id)
    const { data, error } = await supabase.functions.invoke("conectar", {
      body: { action: "waha-qr", kind: "integration", id },
    })
    setBusy(null)
    if (error || data?.error) {
      toast.error(data?.error ?? "Não foi possível obter o QR do WAHA.")
      setQrFor(null)
      return
    }
    if (data?.status === "connected") {
      toast.success("WhatsApp já conectado.")
      setRows((r) => r.map((x) => (x.id === id ? { ...x, status: "connected" } : x)))
      setQrFor(null)
      return
    }
    setQrImage(data?.qr ?? null)
    // Poll do status até conectar.
    stopPoll()
    pollRef.current = setInterval(async () => {
      const { data: s } = await supabase.functions.invoke("conectar", {
        body: { action: "waha-status", kind: "integration", id },
      })
      if (s?.status === "connected") {
        stopPoll()
        setRows((r) =>
          r.map((x) => (x.id === id ? { ...x, status: "connected" } : x))
        )
        setQrFor(null)
        toast.success("WhatsApp conectado.")
      }
    }, 3000)
  }

  function closeQr() {
    stopPoll()
    setQrFor(null)
    setQrImage(null)
  }

  return (
    <CadastroSection
      title="Integrações"
      description="WhatsApp (WAHA), Gmail, GLPI e Zoho. O segredo vai cifrado para o Vault e nunca volta à tela — só o status."
    >
      {rows.length === 0 && <EmptyRow>Nenhuma integração.</EmptyRow>}
      {rows.map((i) => {
        const cfg = (i.config ?? {}) as Record<string, string>
        const isWaha = i.type === "waha"
        const isGmail = i.type === "gmail"
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
                onChange={(e) => patch(i.id, { company_id: e.target.value || null })}
              >
                <option value="">Sem empresa</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {!isGmail && (
                <Input
                  defaultValue={cfg.url ?? ""}
                  placeholder="URL (ex.: WAHA, GLPI)"
                  className="h-8 flex-1"
                  onBlur={(e) =>
                    patch(i.id, { config: { ...cfg, url: e.target.value.trim() } })
                  }
                />
              )}
              {isWaha && (
                <Input
                  defaultValue={cfg.session ?? "prism"}
                  placeholder="sessão"
                  className="h-8 w-28"
                  onBlur={(e) =>
                    patch(i.id, {
                      config: { ...cfg, session: e.target.value.trim() || "prism" },
                    })
                  }
                />
              )}
            </div>

            {isGmail ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex-1 text-sm text-muted-foreground">
                  {cfg.email
                    ? `Conectada: ${cfg.email}`
                    : "Nenhuma conta conectada."}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  onClick={() => connectGmail(i.id)}
                >
                  <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457"
                    />
                  </svg>
                  {cfg.email ? "Reconectar" : "Conectar Gmail"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="password"
                  placeholder={i.has_secret ? "Segredo configurado ••••" : "API key / token"}
                  value={secrets[i.id] ?? ""}
                  onChange={(e) => setSecrets((s) => ({ ...s, [i.id]: e.target.value }))}
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
                {isWaha && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1"
                    disabled={busy === i.id}
                    onClick={() => openQr(i.id)}
                  >
                    {busy === i.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <QrCode className="size-3.5" />
                    )}
                    Ler QR
                  </Button>
                )}
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
            )}
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

      <Dialog open={qrFor !== null} onOpenChange={(o) => !o && closeQr()}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {qrImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrImage}
                alt="QR code do WhatsApp"
                className="size-56 rounded-lg border border-border bg-white p-2"
              />
            ) : (
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            )}
            <p className="text-center text-xs text-muted-foreground">
              No WhatsApp: Aparelhos conectados › Conectar aparelho, e aponte para
              o QR. A janela fecha sozinha quando conectar.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </CadastroSection>
  )
}
