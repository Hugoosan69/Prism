"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import {
  COMMAND_ACTION_LABELS,
  type Command,
  type CommandAction,
} from "@/lib/types"
import { CadastroSection, EmptyRow } from "./cadastro-ui"

const selectCls =
  "h-9 shrink-0 rounded-lg border border-input bg-muted px-2 text-sm outline-none focus-visible:border-ring"
const ACTIONS = Object.keys(COMMAND_ACTION_LABELS) as CommandAction[]

export function CommandsManager() {
  const supabase = createClient()
  const [rows, setRows] = useState<Command[]>([])
  const [trigger, setTrigger] = useState("")
  const [action, setAction] = useState<CommandAction>("create_card")
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from("commands").select("*").order("position")
    setRows(data ?? [])
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add() {
    const t = trigger.trim()
    if (!t) return
    setSaving(true)
    const { data, error } = await supabase
      .from("commands")
      .insert({ trigger: t, action, position: rows.length })
      .select()
      .single()
    setSaving(false)
    if (error || !data) {
      toast.error(
        error?.code === "23505"
          ? "Já existe um comando com esse gatilho."
          : "Não foi possível salvar o comando."
      )
      return
    }
    setRows((r) => [...r, data])
    setTrigger("")
    setAction("create_card")
    toast.success("Comando adicionado.")
  }

  async function patch(id: string, patch: Partial<Command>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    const { error } = await supabase.from("commands").update(patch).eq("id", id)
    if (error) toast.error("Não foi possível atualizar.")
  }

  async function remove(id: string) {
    const { error } = await supabase.from("commands").delete().eq("id", id)
    if (error) {
      toast.error("Não foi possível excluir.")
      return
    }
    setRows((r) => r.filter((x) => x.id !== id))
    toast.success("Comando removido.")
  }

  return (
    <CadastroSection
      title="Comandos"
      description="Gatilho → ação. A execução (no WhatsApp) é a Fase 1; aqui é o cadastro."
    >
      {rows.length === 0 && <EmptyRow>Nenhum comando.</EmptyRow>}
      {rows.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center gap-2">
          <Input
            defaultValue={c.trigger}
            onBlur={(e) =>
              e.target.value.trim() &&
              e.target.value !== c.trigger &&
              patch(c.id, { trigger: e.target.value.trim() })
            }
            className="w-28 shrink-0 font-mono"
          />
          <select
            className={`${selectCls} flex-1`}
            value={c.action}
            onChange={(e) => patch(c.id, { action: e.target.value })}
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {COMMAND_ACTION_LABELS[a]}
              </option>
            ))}
          </select>
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Switch
              checked={c.delete_message}
              onCheckedChange={(v) => patch(c.id, { delete_message: v })}
            />
            Apagar msg
          </label>
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Switch
              checked={c.send_confirmation}
              onCheckedChange={(v) => patch(c.id, { send_confirmation: v })}
            />
            Confirmar
          </label>
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Switch
              checked={c.enabled}
              onCheckedChange={(v) => patch(c.id, { enabled: v })}
            />
            Ativo
          </label>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => remove(c.id)}
            aria-label={`Excluir ${c.trigger}`}
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Input
          placeholder="/gatilho"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          className="w-28 shrink-0 font-mono"
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <select
          className={`${selectCls} flex-1`}
          value={action}
          onChange={(e) => setAction(e.target.value as CommandAction)}
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {COMMAND_ACTION_LABELS[a]}
            </option>
          ))}
        </select>
        <Button onClick={add} disabled={saving || !trigger.trim()} className="gap-1">
          <Plus className="size-4" />
          Adicionar
        </Button>
      </div>
    </CadastroSection>
  )
}
