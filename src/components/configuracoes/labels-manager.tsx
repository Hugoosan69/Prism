"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import type { Company, Label } from "@/lib/types"
import { CadastroSection, EmptyRow } from "./cadastro-ui"

const selectCls =
  "h-9 shrink-0 rounded-lg border border-input bg-muted px-2 text-sm outline-none focus-visible:border-ring"

export function LabelsManager() {
  const supabase = createClient()
  const [rows, setRows] = useState<Label[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [name, setName] = useState("")
  const [color, setColor] = useState("#7c6cff")
  const [companyId, setCompanyId] = useState("")
  const [saving, setSaving] = useState(false)

  async function load() {
    const [{ data: ls }, { data: cs }] = await Promise.all([
      supabase.from("labels").select("*").order("name"),
      supabase.from("companies").select("*").order("name"),
    ])
    setRows(ls ?? [])
    setCompanies(cs ?? [])
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add() {
    const n = name.trim()
    if (!n) return
    setSaving(true)
    const { data, error } = await supabase
      .from("labels")
      .insert({ name: n, color, company_id: companyId || null })
      .select()
      .single()
    setSaving(false)
    if (error || !data) {
      toast.error(
        error?.code === "23505"
          ? "Já existe uma etiqueta com esse nome."
          : "Não foi possível salvar a etiqueta."
      )
      return
    }
    setRows((r) => [...r, data].sort((a, b) => a.name.localeCompare(b.name)))
    setName("")
    setColor("#7c6cff")
    setCompanyId("")
    toast.success("Etiqueta adicionada.")
  }

  async function patch(id: string, patch: Partial<Label>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    const { error } = await supabase.from("labels").update(patch).eq("id", id)
    if (error) toast.error("Não foi possível atualizar.")
  }

  async function remove(id: string) {
    const { error } = await supabase.from("labels").delete().eq("id", id)
    if (error) {
      toast.error("Não foi possível excluir.")
      return
    }
    setRows((r) => r.filter((x) => x.id !== id))
    toast.success("Etiqueta removida.")
  }

  return (
    <CadastroSection
      title="Etiquetas"
      description="Nome, cor e vínculo opcional a uma empresa. Substituem as antigas tags das tarefas."
    >
      {rows.length === 0 && <EmptyRow>Nenhuma etiqueta.</EmptyRow>}
      {rows.map((l) => (
        <div key={l.id} className="flex items-center gap-2">
          <input
            type="color"
            value={l.color}
            onChange={(e) => patch(l.id, { color: e.target.value })}
            className="size-8 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
            aria-label={`Cor de ${l.name}`}
          />
          <Input
            defaultValue={l.name}
            onBlur={(e) =>
              e.target.value.trim() &&
              e.target.value !== l.name &&
              patch(l.id, { name: e.target.value.trim() })
            }
          />
          <select
            className={selectCls}
            value={l.company_id ?? ""}
            onChange={(e) => patch(l.id, { company_id: e.target.value || null })}
          >
            <option value="">Sem empresa</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => remove(l.id)}
            aria-label={`Excluir ${l.name}`}
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
          aria-label="Cor da nova etiqueta"
        />
        <Input
          placeholder="Nova etiqueta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <select
          className={selectCls}
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        >
          <option value="">Sem empresa</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button onClick={add} disabled={saving || !name.trim()} className="gap-1">
          <Plus className="size-4" />
          Adicionar
        </Button>
      </div>
    </CadastroSection>
  )
}
