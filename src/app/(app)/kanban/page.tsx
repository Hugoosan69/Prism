import { createClient } from "@/lib/supabase/server"
import { KanbanBoard } from "@/components/kanban/board"

export const dynamic = "force-dynamic"

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; task?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("position", { ascending: true })

  return (
    <KanbanBoard
      initialTasks={tasks ?? []}
      openNew={params.new === "1"}
      openTaskId={params.task}
    />
  )
}
