"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import type { Source } from "@/lib/types"
import { CadastroSection, EmptyRow } from "./cadastro-ui"

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function SourcesManager() {
  const supabase = createClient()
  const [rows, setRows] = useState<Source[]>([])
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from("sources").select("*").order("position")
    setRows(data ?? [])
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
      .from("sources")
      .insert({ name: n, slug: slugify(n) || `origem-${Date.now()}`, position: rows.length })
      .select()
      .single()
    setSaving(false)
    if (error || !data) {
      toast.error("Não foi possível salvar a origem.")
      return
    }
    setRows((r) => [...r, data])
    setName("")
    toast.success("Origem adicionada.")
  }

  async function rename(id: string, value: string, current: string) {
    if (!value.trim() || value === current) return
    setRows((r) => r.map((x) => (x.id === id ? { ...x, name: value.trim() } : x)))
    const { error } = await supabase
      .from("sources")
      .update({ name: value.trim() })
      .eq("id", id)
    if (error) toast.error("Não foi possível atualizar.")
  }

  async function remove(id: string) {
    const { error } = await supabase.from("sources").delete().eq("id", id)
    if (error) {
      toast.error("Não foi possível excluir.")
      return
    }
    setRows((r) => r.filter((x) => x.id !== id))
    toast.success("Origem removida.")
  }

  return (
    <CadastroSection
      title="Origens"
      description="De onde a demanda veio. Os quatro padrões vêm semeados e são editáveis."
    >
      {rows.length === 0 && <EmptyRow>Nenhuma origem.</EmptyRow>}
      {rows.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <Input
            defaultValue={s.name}
            onBlur={(e) => rename(s.id, e.target.value, s.name)}
          />
          <span className="w-28 shrink-0 font-mono text-[11px] text-muted-foreground">
            {s.slug}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => remove(s.id)}
            aria-label={`Excluir ${s.name}`}
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Input
          placeholder="Nova origem"
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
