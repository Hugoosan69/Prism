"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import type { Task, TaskStatus } from "@/lib/types"
import { SortableTaskCard } from "./task-card"

type Props = {
  status: TaskStatus
  title: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function KanbanColumn({ status, title, tasks, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 transition-colors",
        isOver && "border-primary/40 bg-muted/60"
      )}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-24 flex-1 flex-col gap-2">
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
