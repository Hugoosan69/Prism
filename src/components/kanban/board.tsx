"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { Task, TaskStatus } from "@/lib/types"
import { TASK_STATUS_LABELS } from "@/lib/types"
import { KanbanColumn } from "./column"
import { TaskCard } from "./task-card"
import { TaskDialog } from "./task-dialog"

const STATUSES: TaskStatus[] = ["todo", "doing", "done"]

type Props = {
  initialTasks: Task[]
  openNew?: boolean
  openTaskId?: string
}

export function KanbanBoard({ initialTasks, openNew, openTaskId }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(
    Boolean(openNew) || Boolean(openTaskId)
  )
  const [editingTask, setEditingTask] = useState<Task | null>(
    openTaskId ? (initialTasks.find((t) => t.id === openTaskId) ?? null) : null
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], doing: [], done: [] }
    for (const task of tasks) {
      map[(task.status as TaskStatus) ?? "todo"].push(task)
    }
    for (const status of STATUSES) {
      map[status].sort((a, b) => a.position - b.position)
    }
    return map
  }, [tasks])

  function findTask(id: string) {
    return tasks.find((t) => t.id === id)
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(findTask(String(event.active.id)) ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    const task = findTask(activeId)
    if (!task) return

    const overIsColumn = STATUSES.includes(overId as TaskStatus)
    const targetStatus = overIsColumn
      ? (overId as TaskStatus)
      : ((findTask(overId)?.status ?? task.status) as TaskStatus)

    if (task.status !== targetStatus) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId
            ? {
                ...t,
                status: targetStatus,
                completed_at:
                  targetStatus === "done" ? new Date().toISOString() : null,
              }
            : t
        )
      )
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const task = findTask(activeId)
    if (!task) return

    const status = task.status as TaskStatus
    const column = byStatus[status]
    const fromIndex = column.findIndex((t) => t.id === activeId)
    const toIndex = STATUSES.includes(overId as TaskStatus)
      ? column.length - 1
      : column.findIndex((t) => t.id === overId)

    const reordered =
      fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex
        ? arrayMove(column, fromIndex, toIndex)
        : column

    const updates = new Map<string, Partial<Task>>()
    reordered.forEach((t, index) => {
      if (t.position !== index) updates.set(t.id, { position: index })
    })
    updates.set(activeId, {
      ...updates.get(activeId),
      status,
      completed_at: task.completed_at,
      position: reordered.findIndex((t) => t.id === activeId),
    })

    setTasks((prev) =>
      prev.map((t) => {
        const update = updates.get(t.id)
        return update ? { ...t, ...update } : t
      })
    )

    const supabase = createClient()
    Promise.all(
      [...updates.entries()].map(([id, update]) =>
        supabase.from("tasks").update(update).eq("id", id)
      )
    ).then((results) => {
      if (results.some((r) => r.error)) {
        toast.error("Erro ao salvar a movimentação.")
        router.refresh()
      }
    })
  }

  function openEdit(task: Task) {
    setEditingTask(task)
    setDialogOpen(true)
  }

  function openCreate() {
    setEditingTask(null)
    setDialogOpen(true)
  }

  function handleSaved(saved: Task, isNew: boolean) {
    setTasks((prev) =>
      isNew ? [...prev, saved] : prev.map((t) => (t.id === saved.id ? saved : t))
    )
  }

  function handleDeleted(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Kanban</h1>
        <Button size="sm" onClick={openCreate} className="gap-1">
          <Plus className="size-4" />
          Nova tarefa
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              title={TASK_STATUS_LABELS[status]}
              tasks={byStatus[status]}
              onTaskClick={openEdit}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        nextPosition={byStatus.todo.length}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
