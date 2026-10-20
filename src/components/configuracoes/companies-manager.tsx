"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import type { Company } from "@/lib/types"
import { CadastroSection, EmptyRow } from "./cadastro-ui"

export function CompaniesManager() {
  const supabase = createClient()
  const [rows, setRows] = useState<Company[]>([])
  const [name, setName] = useState("")
  const [color, setColor] = useState("#7c6cff")
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .order("position")
      .order("created_at")
    setRows(data ?? [])
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add() {
    if (!name.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from("companies")
      .insert({ name: name.trim(), color, position: rows.length })
      .select()
      .single()
    setSaving(false)
    if (error || !data) {
      toast.error("Não foi possível salvar a empresa.")
      return
    }
    setRows((r) => [...r, data])
    setName("")
    setColor("#7c6cff")
    toast.success("Empresa adicionada.")
  }

  async function patch(id: string, patch: Partial<Company>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    const { error } = await supabase.from("companies").update(patch).eq("id", id)
    if (error) toast.error("Não foi possível atualizar.")
  }

  async function setDefault(id: string) {
    // Só uma padrão: zera as outras antes (o índice parcial único exige isso).
    await supabase
      .from("companies")
      .update({ is_default: false })
      .neq("id", id)
    await patch(id, { is_default: true })
    setRows((r) => r.map((x) => ({ ...x, is_default: x.id === id })))
    toast.success("Empresa padrão definida.")
  }

  async function remove(id: string) {
    const { error } = await supabase.from("companies").delete().eq("id", id)
    if (error) {
      toast.error("Não foi possível excluir.")
      return
    }
    setRows((r) => r.filter((x) => x.id !== id))
    toast.success("Empresa removida.")
  }

  return (
    <CadastroSection
      title="Empresas"
      description="Nome, cor e empresa padrão para itens sem empresa. Ex.: Disdal, Inko, Pessoal."
    >
      {rows.length === 0 && <EmptyRow>Nenhuma empresa ainda.</EmptyRow>}
      {rows.map((c) => (
        <div key={c.id} className="flex items-center gap-2">
          <input
            type="color"
            value={c.color}
            onChange={(e) => patch(c.id, { color: e.target.value })}
            className="size-8 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
            aria-label={`Cor de ${c.name}`}
          />
          <Input
            defaultValue={c.name}
            onBlur={(e) =>
              e.target.value.trim() &&
              e.target.value !== c.name &&
              patch(c.id, { name: e.target.value.trim() })
            }
          />
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Switch
              checked={c.is_default}
              onCheckedChange={(v) => v && setDefault(c.id)}
            />
            Padrão
          </label>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => remove(c.id)}
            aria-label={`Excluir ${c.name}`}
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="size-8 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
          aria-label="Cor da nova empresa"
        />
        <Input
          placeholder="Nova empresa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add} disabled={saving || !name.trim()} className="gap-1">
          <Plus className="size-4" />
          Adicionar
        </Button>
      </div>
    </CadastroSection>
  )
}
