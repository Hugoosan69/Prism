import Link from "next/link"
import { format, formatDistanceToNow, parseISO, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Bookmark,
  CheckCircle2,
  Circle,
  Database,
  Hourglass,
  Link2,
  StickyNote,
  Wallet,
} from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import {
  despesasDoMes,
  formatarReal,
  mesAtual,
  resumoDoMes,
} from "@/lib/financas"
import type { Expense, ExpensePayment, Income } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function PainelPage() {
  const supabase = await createClient()
  const todayStart = startOfDay(new Date()).toISOString()

  const mes = mesAtual()

  const [
    pending,
    waiting,
    doneToday,
    recentSnippets,
    recentNotes,
    recentLinks,
    expensesResult,
    paymentsResult,
    incomesResult,
  ] = await Promise.all([
      // Pendentes = o que depende de você; o que aguarda terceiros tem card próprio
      supabase
        .from("tasks")
        .select("id, title, priority, due_date", { count: "exact" })
        .in("status", ["todo", "doing"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5),
      supabase
        .from("tasks")
        .select("id, title", { count: "exact" })
        .eq("status", "waiting")
        .order("created_at", { ascending: true })
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
        .from("links")
        .select("id, title, url, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      // O mesmo cálculo da tela de Finanças, por `lib/financas.ts`: duas
      // respostas diferentes para "quanto falta pagar" seria pior que nenhuma.
      supabase.from("expenses").select("*"),
      supabase.from("expense_payments").select("*").eq("month", mes),
      supabase.from("incomes").select("*"),
    ])

  const linhasDoMes = despesasDoMes(
    (expensesResult.data as Expense[]) ?? [],
    (paymentsResult.data as ExpensePayment[]) ?? [],
    mes
  )
  const financas = resumoDoMes(
    linhasDoMes,
    (incomesResult.data as Income[]) ?? [],
    mes
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel"
        meta={format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Circle className="size-4 text-muted-foreground" />
              Tarefas pendentes
            </CardTitle>
            <span className="font-mono text-2xl font-semibold tabular-nums">
              {pending.count ?? 0}
            </span>
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
              <Hourglass
                className="size-4"
                style={{ color: "var(--status-waiting)" }}
              />
              Aguardando retorno
            </CardTitle>
            <span className="font-mono text-2xl font-semibold tabular-nums">
              {waiting.count ?? 0}
            </span>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(waiting.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nada esperando validação.
              </p>
            ) : (
              (waiting.data ?? []).map((task) => (
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="size-4 text-success" />
              Concluídas hoje
            </CardTitle>
            <span className="font-mono text-2xl font-semibold tabular-nums">
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
              <Link2 className="size-4 text-muted-foreground" />
              Links recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(recentLinks.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum link salvo ainda.
              </p>
            ) : (
              (recentLinks.data ?? []).map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 text-sm hover:underline"
                >
                  <span className="truncate">{link.title}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {format(new Date(link.created_at), "dd/MM")}
                  </span>
                </a>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Wallet className="size-4 text-muted-foreground" />
              Saldo do mês
            </CardTitle>
            <span
              className={`font-mono text-xl font-semibold tabular-nums ${
                financas.saldo < 0 ? "text-destructive" : ""
              }`}
            >
              {formatarReal(financas.saldo)}
            </span>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {linhasDoMes.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhuma despesa neste mês.
              </p>
            ) : (
              <p className="text-muted-foreground">
                {financas.faltaPagar > 0
                  ? `Falta pagar ${formatarReal(financas.faltaPagar)}`
                  : "Tudo pago neste mês."}
              </p>
            )}
            <Link href="/financas" className="block hover:underline">
              Abrir Finanças
            </Link>
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
            <Link href="/financas?new=1" className="block hover:underline">
              + Nova despesa
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
