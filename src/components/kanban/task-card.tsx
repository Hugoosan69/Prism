"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format, isPast, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarDays, Check, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Task, TaskPriority } from "@/lib/types"

const priorityColor: Record<TaskPriority, string> = {
  low: "bg-neutral-400",
  medium: "bg-amber-400",
  high: "bg-red-500",
}

export function TaskCard({
  task,
  rank,
  overlay,
  onClick,
  onToggleHighlight,
}: {
  task: Task
  /** Posição na coluna, 1 = mais urgente (topo). Ausente na coluna Concluído. */
  rank?: number
  overlay?: boolean
  onClick?: () => void
  onToggleHighlight?: () => void
}) {
  const done = task.status === "done"
  const overdue =
    task.due_date && !done && isPast(parseISO(task.due_date))

  return (
    <div
      onClick={onClick}
      className={cn(
        "group/card relative cursor-pointer space-y-2 rounded-md border bg-card p-3 text-card-foreground shadow-xs transition-colors hover:border-primary/30",
        overlay && "rotate-2 shadow-md",
        done && "opacity-70",
        // Destaque: barra de acento à esquerda, sem alterar a posição
        task.highlighted &&
          "border-amber-400/50 ring-1 ring-amber-400/40 before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-amber-400"
      )}
    >
      <div className="flex items-start gap-2">
        {done ? (
          <Check
            className="mt-0.5 size-3.5 shrink-0"
            style={{ color: "var(--status-done)" }}
          />
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

        {/* Estrela de destaque: sempre visível se marcada, no hover se não */}
        {onToggleHighlight && (
          <button
            type="button"
            title={task.highlighted ? "Remover destaque" : "Destacar"}
            aria-label={task.highlighted ? "Remover destaque" : "Destacar"}
            aria-pressed={task.highlighted}
            // Impede que o clique inicie o arraste ou abra a edição
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onToggleHighlight()
            }}
            className={cn(
              "-mt-0.5 -mr-1 ml-auto rounded p-1 text-muted-foreground transition-opacity hover:text-amber-400",
              task.highlighted
                ? "opacity-100"
                : "opacity-0 group-hover/card:opacity-100"
            )}
          >
            <Star
              className={cn(
                "size-3.5",
                task.highlighted && "fill-amber-400 text-amber-400"
              )}
            />
          </button>
        )}
      </div>

      {(task.due_date || task.tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 pl-6">
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
          {task.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="px-1.5 text-[10px]">
              {tag}
            </Badge>
          ))}
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
}: {
  task: Task
  rank?: number
  onClick: () => void
  onToggleHighlight: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

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
      />
    </div>
  )
}
