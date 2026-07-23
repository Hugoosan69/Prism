import Link from "next/link"
import { format, formatDistanceToNow, parseISO, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Bookmark,
  CheckCircle2,
  Circle,
  Database,
  File,
  StickyNote,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const todayStart = startOfDay(new Date()).toISOString()

  const [pending, doneToday, recentSnippets, recentNotes, recentFiles] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, priority, due_date", { count: "exact" })
        .neq("status", "done")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5),
      supabase
        .from("tasks")
        .select("id, title", { count: "exact" })
        .eq("status", "done")
        .gte("completed_at", todayStart)
        .limit(5),
      supabase
        .from("snippets")
        .select("id, title, category, last_used_at")
        .not("last_used_at", "is", null)
        .order("last_used_at", { ascending: false })
        .limit(5),
      supabase
        .from("notes")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("files")
        .select("id, name, folder_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Circle className="size-4 text-muted-foreground" />
              Tarefas pendentes
            </CardTitle>
            <span className="text-2xl font-semibold">{pending.count ?? 0}</span>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(pending.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa pendente.
              </p>
            ) : (
              (pending.data ?? []).map((task) => (
                <Link
                  key={task.id}
                  href={`/kanban?task=${task.id}`}
                  className="flex items-center justify-between gap-2 text-sm hover:underline"
                >
                  <span className="truncate">{task.title}</span>
                  {task.due_date && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {format(parseISO(task.due_date), "dd MMM", {
                        locale: ptBR,
                      })}
                    </span>
                  )}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="size-4 text-green-500" />
              Concluídas hoje
            </CardTitle>
            <span className="text-2xl font-semibold">
              {doneToday.count ?? 0}
            </span>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(doneToday.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nada concluído hoje ainda.
              </p>
            ) : (
              (doneToday.data ?? []).map((task) => (
                <Link
                  key={task.id}
                  href={`/kanban?task=${task.id}`}
                  className="block truncate text-sm hover:underline"
                >
                  {task.title}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Database className="size-4 text-muted-foreground" />
              Últimos SQL utilizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(recentSnippets.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma consulta copiada ainda.
              </p>
            ) : (
              (recentSnippets.data ?? []).map((snippet) => (
                <Link
                  key={snippet.id}
                  href={`/sql?snippet=${snippet.id}`}
                  className="flex items-center justify-between gap-2 text-sm hover:underline"
                >
                  <span className="truncate">{snippet.title}</span>
                  {snippet.category && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {snippet.category}
                    </span>
                  )}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <StickyNote className="size-4 text-muted-foreground" />
              Notas recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(recentNotes.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma nota ainda.
              </p>
            ) : (
              (recentNotes.data ?? []).map((note) => (
                <Link
                  key={note.id}
                  href={`/notas/${note.id}`}
                  className="flex items-center justify-between gap-2 text-sm hover:underline"
                >
                  <span className="truncate">{note.title || "Sem título"}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.updated_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <File className="size-4 text-muted-foreground" />
              Arquivos recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(recentFiles.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum arquivo ainda.
              </p>
            ) : (
              (recentFiles.data ?? []).map((file) => (
                <Link
                  key={file.id}
                  href={
                    file.folder_id
                      ? `/arquivos?pasta=${file.folder_id}`
                      : "/arquivos"
                  }
                  className="flex items-center justify-between gap-2 text-sm hover:underline"
                >
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {format(new Date(file.created_at), "dd/MM")}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Bookmark className="size-4 text-muted-foreground" />
              Atalhos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <Link href="/kanban?new=1" className="block hover:underline">
              + Nova tarefa
            </Link>
            <Link href="/sql?new=1" className="block hover:underline">
              + Nova consulta SQL
            </Link>
            <Link href="/notas?new=1" className="block hover:underline">
              + Nova nota
            </Link>
            <Link href="/favoritos?new=1" className="block hover:underline">
              + Novo favorito
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
