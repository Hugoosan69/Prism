"use client"

/**
 * Card de confirmação de escrita.
 *
 * O modelo propõe, este componente grava — pelo supabase-js, do client, como
 * todo o resto do Prism. Enquanto Hugo não clicar, nada existe no banco.
 *
 * O card mostra os valores como o Prism os exibe (coluna "A Fazer", não
 * "todo"), porque o que ele confere aqui tem de ser o que vai aparecer no
 * Kanban depois.
 */

import { useState } from "react"
import {
  Brain,
  Check,
  Database,
  Link2,
  SquareKanban,
  StickyNote,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types"
import type { Proposal } from "./types"

const META: Record<
  string,
  { titulo: string; destino: string; icone: React.ElementType }
> = {
  propor_tarefa: { titulo: "Nova tarefa", destino: "Kanban", icone: SquareKanban },
  propor_nota: { titulo: "Nova nota", destino: "Notas", icone: StickyNote },
  propor_snippet: { titulo: "Nova consulta", destino: "SQL", icone: Database },
  propor_link: { titulo: "Novo link", destino: "Links", icone: Link2 },
  propor_memoria: { titulo: "Guardar na memória", destino: "vale em toda conversa", icone: Brain },
  // propor_memoria com tipo "jeito" troca o rótulo em tempo de render, abaixo.
}

function str(value: unknown): string {
  return typeof value === "string" ? value : ""
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
  const meta = META[tool] ?? {
    titulo: "Proposta",
    destino: "Prism",
    icone: Database,
  }
  const Icone = meta.icone
  // Guardar um jeito muda o assistente, não o acervo: vale dizer isso no card,
  // senão as duas coisas parecem a mesma e Hugo confirma sem perceber a
  // diferença.
  const rotulo =
    tool === "propor_memoria" && str(args.tipo) === "jeito"
      ? { titulo: "Ajustar seu jeito", destino: "muda como o assistente responde" }
      : meta

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
      } else if (tool === "propor_memoria") {
        // onConflict em subject_key, a coluna gerada com lower(trim(subject)):
        // ensinar de novo sobre o mesmo tema corrige o que estava lá em vez de
        // deixar duas versões brigando no prompt. Apontar para "subject" não
        // funciona — o unique está na coluna gerada, e o Postgres recusa o
        // ON CONFLICT que não casa com um índice existente.
        const res = await supabase.from("memories").upsert(
          {
            subject: str(args.assunto),
            content: str(args.fato),
            kind: str(args.tipo) === "jeito" ? "jeito" : "fato",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "subject_key" }
        )
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

      toast.success(
        tool === "propor_memoria"
          ? "Guardado na memória"
          : `Salvo em ${rotulo.destino}`
      )
      onResolve(proposal.id, "aceita")
    } finally {
      setSaving(false)
    }
  }

  const titulo = str(args.titulo) || str(args.assunto)
  const corpo =
    str(args.descricao) ||
    str(args.conteudo) ||
    str(args.codigo) ||
    str(args.url) ||
    str(args.fato)
  const monoespacado = tool === "propor_snippet"

  const tags = Array.isArray(args.tags) ? args.tags.map(String) : []
  const taskStatus = (str(args.status) || "todo") as TaskStatus
  const taskPriority = (str(args.prioridade) || "medium") as TaskPriority

  return (
    <div
      className={`my-3 overflow-hidden rounded-xl border transition-opacity ${
        status === "recusada" ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <Icone className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">{rotulo.titulo}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {rotulo.destino}
        </span>
        {status !== "pendente" && (
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">
            {status === "aceita" ? "criada" : "descartada"}
          </span>
        )}
      </div>

      <div className="space-y-2 px-3 py-2.5">
        <p className="text-sm font-medium">{titulo}</p>

        {corpo && (
          <p
            className={`whitespace-pre-wrap text-muted-foreground ${
              monoespacado ? "font-mono text-xs" : "text-[13px]"
            }`}
          >
            {corpo.length > 400 ? `${corpo.slice(0, 400)}…` : corpo}
          </p>
        )}

        {tool === "propor_tarefa" && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ background: TASK_STATUS_COLORS[taskStatus] }}
              />
              {TASK_STATUS_LABELS[taskStatus]}
            </span>
            <span>Prioridade {TASK_PRIORITY_LABELS[taskPriority]}</span>
            {tags.length > 0 && <span>{tags.join(" · ")}</span>}
          </div>
        )}

        {tool === "propor_snippet" && str(args.categoria) && (
          <p className="text-[11px] text-muted-foreground">
            {str(args.categoria)}
          </p>
        )}
      </div>

      {status === "pendente" && (
        <div className="flex gap-2 border-t px-3 py-2">
          <Button size="sm" onClick={accept} disabled={saving}>
            <Check className="size-3.5" />
            {saving
              ? "Salvando…"
              : tool === "propor_memoria"
                ? "Guardar"
                : "Criar"}
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
