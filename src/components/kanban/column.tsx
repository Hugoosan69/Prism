"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import type { Company, Label, Source, Task, TaskStatus } from "@/lib/types"
import { TASK_STATUS_COLORS, TASK_STATUS_HINTS } from "@/lib/types"
import { SortableTaskCard } from "./task-card"

type Props = {
  status: TaskStatus
  title: string
  tasks: Task[]
  companiesById: Record<string, Company>
  sourcesById: Record<string, Source>
  labelsByTask: Record<string, Label[]>
  onTaskClick: (task: Task) => void
  onToggleHighlight: (task: Task) => void
}

export function KanbanColumn({
  status,
  title,
  tasks,
  companiesById,
  sourcesById,
  labelsByTask,
  onTaskClick,
  onToggleHighlight,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const color = TASK_STATUS_COLORS[status]
  const hint = TASK_STATUS_HINTS[status]

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-muted/30 transition-colors",
        isOver && "border-primary/40 bg-muted/60"
      )}
    >
      <div
        aria-hidden
        className="h-[3px] w-full shrink-0 rounded-t-xl"
        style={{ background: color }}
      />
      <div className="flex items-center justify-between px-3 pt-1">
        <span
          className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
          title={hint}
        >
          {title}
        </span>
        <span className="font-mono text-[11px] tabular-nums" style={{ color }}>
          {tasks.length}
        </span>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-24 flex-1 flex-col gap-2 px-3 pb-3">
          {tasks.map((task, index) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              rank={status === "done" ? undefined : index + 1}
              onClick={() => onTaskClick(task)}
              onToggleHighlight={() => onToggleHighlight(task)}
              company={task.company_id ? companiesById[task.company_id] : undefined}
              source={task.source_id ? sourcesById[task.source_id] : undefined}
              labels={labelsByTask[task.id]}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
