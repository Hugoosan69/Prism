"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format, isPast, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CalendarDays,
  Check,
  ExternalLink,
  Inbox,
  LifeBuoy,
  Mail,
  MessageCircle,
  PencilLine,
  Star,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Company, Label, Source, Task, TaskPriority } from "@/lib/types"

const priorityColor: Record<TaskPriority, string> = {
  low: "bg-neutral-400",
  medium: "bg-amber-400",
  high: "bg-red-500",
}

/** Ícones das origens, por nome (coluna sources.icon). Fallback: Inbox. */
const SOURCE_ICONS: Record<string, LucideIcon> = {
  MessageCircle,
  Mail,
  LifeBuoy,
  PencilLine,
  Inbox,
}

export type TaskCardMeta = {
  company?: Company
  source?: Source
  labels?: Label[]
}

export function TaskCard({
  task,
  rank,
  overlay,
  onClick,
  onToggleHighlight,
  company,
  source,
  labels,
}: {
  task: Task
  rank?: number
  overlay?: boolean
  onClick?: () => void
  onToggleHighlight?: () => void
} & TaskCardMeta) {
  const done = task.status === "done"
  const overdue = task.due_date && !done && isPast(parseISO(task.due_date))
  const SourceIcon = source ? SOURCE_ICONS[source.icon] ?? Inbox : null

  return (
    <div
      onClick={onClick}
      className={cn(
        "group/card relative cursor-pointer space-y-2 rounded-lg border bg-card p-3 text-card-foreground shadow-[var(--shadow-sm)] transition-colors hover:border-primary/30",
        overlay && "rotate-2 shadow-md",
        done && "opacity-70",
        task.highlighted &&
          "border-amber-400/50 ring-1 ring-amber-400/40 before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-amber-400"
      )}
    >
      {/* Trilha da empresa à esquerda: cor que vem do cadastro. */}
      {company && (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-[3px] rounded-full"
          style={{ background: company.color }}
          title={company.name}
        />
      )}
      <div className="flex items-start gap-2">
        {done ? (
          <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: "var(--status-done)" }} />
        ) : (
          <span className="mt-0.5 w-3.5 shrink-0 text-center font-mono text-[11px] leading-4 text-muted-foreground tabular-nums">
            {rank}
          </span>
        )}
        <span
          className={cn(
            "mt-1 size-2 shrink-0 rounded-full",
            priorityColor[(task.priority as TaskPriority) ?? "medium"]
          )}
          title="Prioridade"
        />
        <span
          className={cn(
            "text-sm leading-snug font-medium",
            done && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </span>

        {onToggleHighlight && (
          <button
            type="button"
            title={task.highlighted ? "Remover destaque" : "Destacar"}
            aria-label={task.highlighted ? "Remover destaque" : "Destacar"}
            aria-pressed={task.highlighted}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onToggleHighlight()
            }}
            className={cn(
              "-mt-0.5 -mr-1 ml-auto rounded p-1 text-muted-foreground transition-opacity hover:text-amber-400",
              task.highlighted ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
            )}
          >
            <Star className={cn("size-3.5", task.highlighted && "fill-amber-400 text-amber-400")} />
          </button>
        )}
      </div>

      {(task.due_date ||
        (labels && labels.length > 0) ||
        source ||
        company ||
        task.external_url) && (
        <div className="flex flex-wrap items-center gap-1.5 pl-6">
          {company && (
            <span className="text-[11px] text-muted-foreground">{company.name}</span>
          )}
          {SourceIcon && (
            <span title={source?.name} className="inline-flex">
              <SourceIcon className="size-3 text-muted-foreground" />
            </span>
          )}
          {task.due_date && (
            <span
              className={cn(
                "flex items-center gap-1 font-mono text-[11px] text-muted-foreground",
                overdue && "text-destructive"
              )}
            >
              <CalendarDays className="size-3" />
              {format(parseISO(task.due_date), "dd MMM", { locale: ptBR })}
            </span>
          )}
          {labels?.map((l) => (
            <span
              key={l.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${l.color}22`, color: l.color }}
            >
              {l.name}
            </span>
          ))}
          {task.external_url && (
            <a
              href={task.external_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              title="Abrir origem"
              className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-primary hover:bg-primary/10"
            >
              <ExternalLink className="size-3" />
              Abrir origem
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export function SortableTaskCard({
  task,
  rank,
  onClick,
  onToggleHighlight,
  company,
  source,
  labels,
}: {
  task: Task
  rank?: number
  onClick: () => void
  onToggleHighlight: () => void
} & TaskCardMeta) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        rank={rank}
        onClick={onClick}
        onToggleHighlight={onToggleHighlight}
        company={company}
        source={source}
        labels={labels}
      />
    </div>
  )
}
