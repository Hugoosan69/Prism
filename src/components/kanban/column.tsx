"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import type { Task, TaskStatus } from "@/lib/types"
import { TASK_STATUS_COLORS, TASK_STATUS_HINTS } from "@/lib/types"
import { SortableTaskCard } from "./task-card"

type Props = {
  status: TaskStatus
  title: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function KanbanColumn({ status, title, tasks, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const color = TASK_STATUS_COLORS[status]
  const hint = TASK_STATUS_HINTS[status]

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 overflow-hidden rounded-xl border bg-muted/30 transition-colors",
        isOver && "border-primary/40 bg-muted/60"
      )}
    >
      {/* Faixa do estágio: identifica a coluna sem pesar na interface */}
      <div
        aria-hidden
        className="h-[3px] w-full shrink-0"
        style={{ background: color }}
      />
      <div className="flex items-center justify-between px-3 pt-0.5">
        <span className="text-[13px] font-medium" title={hint}>
          {title}
        </span>
        <span
          className="font-mono text-[11px] tabular-nums"
          style={{ color }}
        >
          {tasks.length}
        </span>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-24 flex-1 flex-col gap-2 px-3 pb-3">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
