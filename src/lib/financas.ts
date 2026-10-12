/**
 * Regras de recorrência e o cálculo do mês.
 *
 * Fica fora dos componentes de propósito: a mesma projeção é usada pela tela de
 * Finanças, pelo cartão do dashboard e pelo script de importação. Se morasse no
 * componente, o dashboard teria uma segunda implementação — e duas respostas
 * diferentes para "quanto falta pagar" é pior que nenhuma.
 *
 * Tudo aqui raciocina em **mês**, nunca em data. O mês é sempre a string
 * "YYYY-MM-DD" do dia 1, que é como a coluna `date` do Postgres volta no JSON.
 * Comparar mês como texto nesse formato funciona e evita fuso: `new Date()`
 * sobre "2026-08-01" vira 31/07 às 21h em Brasília, e a despesa pularia de mês.
 */

import type { Expense, ExpensePayment, Income } from "./types"

/** "2026-08-01" a partir de um Date local. */
export function mesDe(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  return `${ano}-${mes}-01`
}

/** O primeiro dia do mês corrente. */
export const mesAtual = () => mesDe(new Date())

/** Soma meses sem passar por Date: "2026-11-01" + 3 = "2027-02-01". */
export function somarMeses(mes: string, quantidade: number): string {
  const [ano, m] = mes.split("-").map(Number)
  const total = ano * 12 + (m - 1) + quantidade
  const anoNovo = Math.floor(total / 12)
  const mesNovo = String((total % 12) + 1).padStart(2, "0")
  return `${anoNovo}-${mesNovo}-01`
}

/** Distância em meses, negativa quando `mes` é anterior a `base`. */
export function diferencaEmMeses(base: string, mes: string): number {
  const [anoA, a] = base.split("-").map(Number)
  const [anoB, b] = mes.split("-").map(Number)
  return (anoB * 12 + b) - (anoA * 12 + a)
}

/** "2026-08-01" -> "agosto de 2026", para o seletor. */
export function rotuloDoMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number)
  // Dia 15 e não 1: imune a qualquer deslocamento de fuso na formatação.
  return new Date(ano, m - 1, 15).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })
}

export const formatarReal = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

/** Qual parcela cai neste mês, 1-based. Só faz sentido em parcelada. */
export function numeroDaParcela(expense: Expense, mes: string): number {
  return diferencaEmMeses(expense.start_month, mes) + 1
}

/**
 * A despesa aparece neste mês?
 *
 * Nenhuma despesa aparece antes do mês de início — nem a mensal. Esse é o
 * detalhe que impede uma conta lançada hoje de surgir retroativamente em
 * janeiro e bagunçar um mês já fechado.
 */
export function apareceNoMes(expense: Expense, mes: string): boolean {
  const desde = diferencaEmMeses(expense.start_month, mes)
  if (desde < 0) return false

  switch (expense.recurrence) {
    case "unica":
      return desde === 0
    case "parcelada":
      return desde < (expense.installments_total ?? 0)
    default:
      return true
  }
}

/** Mesma regra para provento: recorrente vale do mês de início em diante. */
export function proventoNoMes(income: Income, mes: string): boolean {
  const desde = diferencaEmMeses(income.month, mes)
  return income.recurring ? desde >= 0 : desde === 0
}

export type LinhaDoMes = {
  expense: Expense
  /** O pagamento daquele mês, quando existe. */
  payment: ExpensePayment | null
  /** O que vale para o mês: o valor congelado no pagamento, ou o atual. */
  valor: number
  pago: boolean
  /** Só em parcelada: { numero: 3, total: 10 }. */
  parcela: { numero: number; total: number } | null
}

/**
 * Monta as linhas de um mês.
 *
 * `payments` precisa ser só os pagamentos daquele mês — a tela busca assim, e
 * filtrar de novo aqui esconderia um erro de consulta em vez de revelá-lo.
 */
export function despesasDoMes(
  expenses: Expense[],
  payments: ExpensePayment[],
  mes: string
): LinhaDoMes[] {
  const porDespesa = new Map(payments.map((p) => [p.expense_id, p]))

  return expenses
    .filter((e) => e.active && apareceNoMes(e, mes))
    .map((expense) => {
      const payment = porDespesa.get(expense.id) ?? null
      return {
        expense,
        payment,
        // O valor pago vence o atual: reajustar a conta não reescreve o que
        // já foi pago nos meses anteriores.
        valor: payment?.amount_paid ?? expense.amount,
        pago: payment !== null,
        parcela:
          expense.recurrence === "parcelada"
            ? {
                numero: numeroDaParcela(expense, mes),
                total: expense.installments_total ?? 0,
              }
            : null,
      }
    })
    .sort((a, b) => a.expense.description.localeCompare(b.expense.description, "pt-BR"))
}

export type ResumoDoMes = {
  proventos: number
  despesas: number
  saldo: number
  pago: number
  faltaPagar: number
}

export function resumoDoMes(
  linhas: LinhaDoMes[],
  incomes: Income[],
  mes: string
): ResumoDoMes {
  const proventos = incomes
    .filter((i) => proventoNoMes(i, mes))
    .reduce((soma, i) => soma + i.amount, 0)

  const despesas = linhas.reduce((soma, l) => soma + l.valor, 0)
  const pago = linhas.filter((l) => l.pago).reduce((soma, l) => soma + l.valor, 0)

  return {
    proventos,
    despesas,
    saldo: proventos - despesas,
    pago,
    faltaPagar: despesas - pago,
  }
}

/** Os proventos que valem no mês, para a lista da tela. */
export const proventosDoMes = (incomes: Income[], mes: string) =>
  incomes
    .filter((i) => proventoNoMes(i, mes))
    .sort((a, b) => b.amount - a.amount)
