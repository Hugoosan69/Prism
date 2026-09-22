"use client"

/**
 * Card de confirmação de escrita.
 *
 * O modelo propõe, este componente grava — pelo supabase-js, do client, como
 * todo o resto do Prism. Enquanto Hugo não clicar, nada existe no banco.
 */

import { useState } from "react"
import { Check, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { Proposal } from "./types"

const TITLES: Record<string, string> = {
  propor_tarefa: "Criar tarefa",
  propor_nota: "Criar nota",
  propor_snippet: "Salvar consulta SQL",
  propor_link: "Salvar link",
}

const DESTINATIONS: Record<string, string> = {
  propor_tarefa: "Kanban",
  propor_nota: "Notas",
  propor_snippet: "SQL",
  propor_link: "Links",
}

function str(value: unknown): string {
  return typeof value === "string" ? value : ""
}

/** Campos mostrados no card, em ordem de importância para conferir. */
function preview(tool: string, args: Record<string, unknown>) {
  switch (tool) {
    case "propor_tarefa":
      return [
        ["Título", str(args.titulo)],
        ["Descrição", str(args.descricao)],
        ["Coluna", str(args.status) || "todo"],
        ["Prioridade", str(args.prioridade) || "medium"],
        ["Tags", (Array.isArray(args.tags) ? args.tags : []).join(", ")],
      ]
    case "propor_nota":
      return [
        ["Título", str(args.titulo)],
        ["Conteúdo", str(args.conteudo)],
      ]
    case "propor_snippet":
      return [
        ["Título", str(args.titulo)],
        ["Categoria", str(args.categoria)],
        ["Descrição", str(args.descricao)],
        ["Código", str(args.codigo)],
      ]
    case "propor_link":
      return [
        ["Título", str(args.titulo)],
        ["URL", str(args.url)],
        ["Descrição", str(args.descricao)],
      ]
    default:
      return []
  }
}

export function ProposalCard({
  proposal,
  onResolve,
}: {
  proposal: Proposal
  onResolve: (id: string, status: "aceita" | "recusada") => void
}) {
  const [saving, setSaving] = useState(false)
  const { tool, args, status } = proposal

  async function accept() {
    setSaving(true)
    const supabase = createClient()

    try {
      let error = null

      if (tool === "propor_tarefa") {
        const res = await supabase.from("tasks").insert({
          title: str(args.titulo),
          description: str(args.descricao),
          status: str(args.status) || "todo",
          priority: str(args.prioridade) || "medium",
          tags: Array.isArray(args.tags) ? args.tags.map(String) : [],
        })
        error = res.error
      } else if (tool === "propor_nota") {
        const res = await supabase.from("notes").insert({
          title: str(args.titulo),
          content: str(args.conteudo),
        })
        error = res.error
      } else if (tool === "propor_snippet") {
        const res = await supabase.from("snippets").insert({
          title: str(args.titulo),
          code: str(args.codigo),
          description: str(args.descricao),
          category: str(args.categoria),
        })
        error = res.error
      } else if (tool === "propor_link") {
        const res = await supabase.from("links").insert({
          title: str(args.titulo),
          url: str(args.url),
          description: str(args.descricao),
        })
        error = res.error
      }

      if (error) {
        toast.error(`Não deu para salvar: ${error.message}`)
        return
      }

      toast.success(`Salvo em ${DESTINATIONS[tool] ?? "Prism"}`)
      onResolve(proposal.id, "aceita")
    } finally {
      setSaving(false)
    }
  }

  const fields = preview(tool, args).filter(([, value]) => value)

  return (
    <div className="my-2 rounded-lg border bg-card/50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-medium">
          {TITLES[tool] ?? "Proposta"}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          → {DESTINATIONS[tool] ?? "Prism"}
        </span>
        {status !== "pendente" && (
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">
            {status}
          </span>
        )}
      </div>

      <dl className="space-y-1.5">
        {fields.map(([label, value]) => (
          <div key={label} className="text-sm">
            <dt className="text-[11px] text-muted-foreground">{label}</dt>
            <dd className="whitespace-pre-wrap break-words font-[inherit]">
              {value.length > 600 ? `${value.slice(0, 600)}…` : value}
            </dd>
          </div>
        ))}
      </dl>

      {status === "pendente" && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={accept} disabled={saving}>
            <Check className="size-3.5" />
            {saving ? "Salvando…" : "Criar"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={() => onResolve(proposal.id, "recusada")}
          >
            <X className="size-3.5" />
            Descartar
          </Button>
        </div>
      )}
    </div>
  )
}
