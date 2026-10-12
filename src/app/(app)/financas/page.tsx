import { MonthView } from "@/components/financas/month-view"
import { mesAtual } from "@/lib/financas"
import { createClient } from "@/lib/supabase/server"
import type { Expense, ExpensePayment, Income } from "@/lib/types"

export const dynamic = "force-dynamic"

/** "2026-10" do query param vira o primeiro dia do mês. Inválido cai no atual. */
function mesDoParam(valor: string | undefined): string {
  return valor && /^\d{4}-\d{2}$/.test(valor) ? `${valor}-01` : mesAtual()
}

export default async function FinancasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; new?: string; expense?: string }>
}) {
  const params = await searchParams
  const mes = mesDoParam(params.mes)
  const supabase = await createClient()

  // As despesas vêm inteiras, e não filtradas por mês, porque a projeção da
  // recorrência é feita no app: uma despesa mensal de 2024 ainda vale hoje e
  // nenhum filtro de data no banco a traria sem replicar a regra em SQL.
  const [expensesResult, paymentsResult, incomesResult] = await Promise.all([
    supabase.from("expenses").select("*").order("description"),
    supabase.from("expense_payments").select("*").eq("month", mes),
    supabase.from("incomes").select("*").order("amount", { ascending: false }),
  ])

  return (
    <MonthView
      mes={mes}
      initialExpenses={(expensesResult.data as Expense[]) ?? []}
      initialPayments={(paymentsResult.data as ExpensePayment[]) ?? []}
      initialIncomes={(incomesResult.data as Income[]) ?? []}
      erro={
        expensesResult.error?.message ??
        paymentsResult.error?.message ??
        incomesResult.error?.message ??
        null
      }
      abrirNovo={params.new === "1"}
      editarId={params.expense ?? null}
    />
  )
}
