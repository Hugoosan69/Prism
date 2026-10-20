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
import { PageHeader } from "@/components/layout/page-header"
import { createClient } from "@/lib/supabase/client"
import type { Company, Label, Source, Task, TaskStatus } from "@/lib/types"
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
} from "@/lib/types"
import { KanbanColumn } from "./column"
import { TaskCard } from "./task-card"
import { TaskDialog } from "./task-dialog"

const STATUSES = TASK_STATUSES
const selectCls =
  "h-8 rounded-lg border border-input bg-muted px-2 text-xs outline-none focus-visible:border-ring"

type Props = {
  initialTasks: Task[]
  companies: Company[]
  sources: Source[]
  labels: Label[]
  initialLabelsByTask: Record<string, Label[]>
  openNew?: boolean
  openTaskId?: string
}

export function KanbanBoard({
  initialTasks,
  companies,
  sources,
  labels,
  initialLabelsByTask,
  openNew,
  openTaskId,
}: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [labelsByTask, setLabelsByTask] =
    useState<Record<string, Label[]>>(initialLabelsByTask)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(
    Boolean(openNew) || Boolean(openTaskId)
  )
  const [editingTask, setEditingTask] = useState<Task | null>(
    openTaskId ? (initialTasks.find((t) => t.id === openTaskId) ?? null) : null
  )

  // Filtros de Demandas: empresa, origem, etiqueta, prioridade.
  const [fCompany, setFCompany] = useState("")
  const [fSource, setFSource] = useState("")
  const [fLabel, setFLabel] = useState("")
  const [fPriority, setFPriority] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const companiesById = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c])),
    [companies]
  )
  const sourcesById = useMemo(
    () => Object.fromEntries(sources.map((s) => [s.id, s])),
    [sources]
  )
  const labelsById = useMemo(
    () => Object.fromEntries(labels.map((l) => [l.id, l])),
    [labels]
  )

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (fCompany && t.company_id !== fCompany) return false
      if (fSource && t.source_id !== fSource) return false
      if (fPriority && t.priority !== fPriority) return false
      if (fLabel && !(labelsByTask[t.id] ?? []).some((l) => l.id === fLabel))
        return false
      return true
    })
  }, [tasks, fCompany, fSource, fPriority, fLabel, labelsByTask])

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      doing: [],
      waiting: [],
      done: [],
    }
    for (const task of filtered) {
      map[(task.status as TaskStatus) ?? "todo"].push(task)
    }
    for (const status of STATUSES) {
      map[status].sort((a, b) => a.position - b.position)
    }
    return map
  }, [filtered])

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

  function handleLabelsSaved(taskId: string, labelIds: string[]) {
    const objs = labelIds.map((id) => labelsById[id]).filter(Boolean) as Label[]
    setLabelsByTask((prev) => ({ ...prev, [taskId]: objs }))
  }

  function handleDeleted(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function handleToggleHighlight(task: Task) {
    const next = !task.highlighted
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, highlighted: next } : t))
    )
    const supabase = createClient()
    supabase
      .from("tasks")
      .update({ highlighted: next })
      .eq("id", task.id)
      .then(({ error }) => {
        if (error) {
          toast.error("Erro ao destacar a tarefa.")
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...t, highlighted: task.highlighted } : t
            )
          )
        }
      })
  }

  const filtering = fCompany || fSource || fLabel || fPriority

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        title="Demandas"
        meta={[
          `${tasks.filter((t) => t.status !== "done").length} em aberto`,
          byStatus.waiting.length > 0 && `${byStatus.waiting.length} aguardando`,
        ]
          .filter(Boolean)
          .join(" · ")}
      >
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" />
          Nova demanda
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className={selectCls}
          value={fCompany}
          onChange={(e) => setFCompany(e.target.value)}
        >
          <option value="">Todas as empresas</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={selectCls}
          value={fSource}
          onChange={(e) => setFSource(e.target.value)}
        >
          <option value="">Todas as origens</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className={selectCls}
          value={fLabel}
          onChange={(e) => setFLabel(e.target.value)}
        >
          <option value="">Todas as etiquetas</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          className={selectCls}
          value={fPriority}
          onChange={(e) => setFPriority(e.target.value)}
        >
          <option value="">Qualquer prioridade</option>
          {Object.entries(TASK_PRIORITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        {filtering && (
          <button
            onClick={() => {
              setFCompany("")
              setFSource("")
              setFLabel("")
              setFPriority("")
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              title={TASK_STATUS_LABELS[status]}
              tasks={byStatus[status]}
              companiesById={companiesById}
              sourcesById={sourcesById}
              labelsByTask={labelsByTask}
              onTaskClick={openEdit}
              onToggleHighlight={handleToggleHighlight}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              overlay
              company={
                activeTask.company_id
                  ? companiesById[activeTask.company_id]
                  : undefined
              }
              source={
                activeTask.source_id
                  ? sourcesById[activeTask.source_id]
                  : undefined
              }
              labels={labelsByTask[activeTask.id]}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        nextPosition={byStatus.todo.length}
        companies={companies}
        sources={sources}
        labels={labels}
        onSaved={handleSaved}
        onLabelsSaved={handleLabelsSaved}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
