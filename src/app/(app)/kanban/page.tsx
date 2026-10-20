import { createClient } from "@/lib/supabase/server"
import { KanbanBoard } from "@/components/kanban/board"
import type { Label } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; task?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const [
    { data: tasks },
    { data: companies },
    { data: sources },
    { data: labels },
    { data: taskLabels },
  ] = await Promise.all([
    supabase.from("tasks").select("*").order("position", { ascending: true }),
    supabase.from("companies").select("*").order("position").order("name"),
    supabase.from("sources").select("*").order("position"),
    supabase.from("labels").select("*").order("name"),
    supabase.from("task_labels").select("task_id, labels(*)"),
  ])

  // Mapa tarefa -> etiquetas, para o card e o filtro.
  const labelsByTask: Record<string, Label[]> = {}
  for (const row of taskLabels ?? []) {
    const label = row.labels as Label | null
    if (!label) continue
    ;(labelsByTask[row.task_id] ??= []).push(label)
  }

  return (
    <KanbanBoard
      initialTasks={tasks ?? []}
      companies={companies ?? []}
      sources={sources ?? []}
      labels={labels ?? []}
      initialLabelsByTask={labelsByTask}
      openNew={params.new === "1"}
      openTaskId={params.task}
    />
  )
}
