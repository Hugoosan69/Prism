"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format, isPast, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarDays } from "lucide-react"
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
  overlay,
  onClick,
}: {
  task: Task
  overlay?: boolean
  onClick?: () => void
}) {
  const overdue =
    task.due_date && task.status !== "done" && isPast(parseISO(task.due_date))

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer space-y-2 rounded-md border bg-card p-3 text-card-foreground shadow-xs transition-colors hover:border-primary/30",
        overlay && "rotate-2 shadow-md"
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            priorityColor[(task.priority as TaskPriority) ?? "medium"]
          )}
          title={`Prioridade`}
        />
        <span className="text-sm leading-snug font-medium">{task.title}</span>
      </div>
      {(task.due_date || task.tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 pl-4">
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
  onClick,
}: {
  task: Task
  onClick: () => void
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
      <TaskCard task={task} onClick={onClick} />
    </div>
  )
}
