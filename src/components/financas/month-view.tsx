"use client"

/**
 * A tela do mês: resumo, despesas e proventos.
 *
 * O estado vive aqui e as mutações são otimistas, como no resto do Prism. O
 * mês é query param (`?mes=YYYY-MM`) e não estado local: assim um mês
 * específico é um link que dá para salvar, e o botão voltar do navegador
 * funciona entre meses.
 */

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  despesasDoMes,
  formatarReal,
  mesAtual,
  proventosDoMes,
  resumoDoMes,
  rotuloDoMes,
  somarMeses,
} from "@/lib/financas"
import type { Expense, ExpensePayment, Income } from "@/lib/types"
import { ExpenseDialog } from "./expense-dialog"
import { ExpenseRow } from "./expense-row"
import { IncomeBlock } from "./income-block"

export function MonthView({
  mes,
  initialExpenses,
  initialPayments,
  initialIncomes,
  erro,
  abrirNovo,
  editarId,
}: {
  mes: string
  initialExpenses: Expense[]
  initialPayments: ExpensePayment[]
  initialIncomes: Income[]
  erro: string | null
  abrirNovo: boolean
  editarId: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [expenses, setExpenses] = useState(initialExpenses)
  const [payments, setPayments] = useState(initialPayments)
  const [incomes, setIncomes] = useState(initialIncomes)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Expense | null>(null)
  const [paraRemover, setParaRemover] = useState<Expense | null>(null)

  // O servidor é a fonte: ao trocar de mês, a página recarrega com os
  // pagamentos daquele mês e o estado local tem de acompanhar.
  useEffect(() => {
    setExpenses(initialExpenses)
    setPayments(initialPayments)
    setIncomes(initialIncomes)
  }, [initialExpenses, initialPayments, initialIncomes])

  useEffect(() => {
    if (erro) toast.error(`Não deu para carregar: ${erro}`)
  }, [erro])

  // Deep links: ?new=1 e ?expense=<id> abrem o diálogo já montado.
  useEffect(() => {
    if (abrirNovo) {
      setEmEdicao(null)
      setDialogAberto(true)
    } else if (editarId) {
      const alvo = expenses.find((e) => e.id === editarId)
      if (alvo) {
        setEmEdicao(alvo)
        setDialogAberto(true)
      }
    }
    // Só na montagem: reabrir a cada render prenderia o diálogo aberto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const linhas = useMemo(
    () => despesasDoMes(expenses, payments, mes),
    [expenses, payments, mes]
  )
  const proventos = useMemo(() => proventosDoMes(incomes, mes), [incomes, mes])
  const resumo = useMemo(
    () => resumoDoMes(linhas, incomes, mes),
    [linhas, incomes, mes]
  )

  function irPara(novoMes: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mes", novoMes.slice(0, 7))
    params.delete("new")
    params.delete("expense")
    router.push(`/financas?${params}`)
  }

  /**
   * Marca ou desmarca o pagamento do mês.
   *
   * Grava `amount_paid` com o valor vigente: reajustar a despesa depois não
   * pode reescrever o que já foi pago.
   */
  async function togglePago(expense: Expense, valor: number) {
    const existente = payments.find((p) => p.expense_id === expense.id)
    const supabase = createClient()

    if (existente) {
      setPayments((atuais) => atuais.filter((p) => p.id !== existente.id))
      const { error } = await supabase
        .from("expense_payments")
        .delete()
        .eq("id", existente.id)
      if (error) {
        setPayments((atuais) => [...atuais, existente])
        toast.error(`Não deu para desmarcar: ${error.message}`)
      }
      return
    }

    const otimista: ExpensePayment = {
      id: `tmp-${expense.id}`,
      expense_id: expense.id,
      month: mes,
      amount_paid: valor,
      paid_at: new Date().toISOString(),
    }
    setPayments((atuais) => [...atuais, otimista])

    const { data, error } = await supabase
      .from("expense_payments")
      .insert({ expense_id: expense.id, month: mes, amount_paid: valor })
      .select()
      .single()

    if (error || !data) {
      setPayments((atuais) => atuais.filter((p) => p.id !== otimista.id))
      toast.error(`Não deu para marcar: ${error?.message ?? "erro"}`)
      return
    }
    setPayments((atuais) =>
      atuais.map((p) => (p.id === otimista.id ? (data as ExpensePayment) : p))
    )
  }

  async function removerDespesa(expense: Expense) {
    setParaRemover(null)
    setExpenses((atuais) => atuais.filter((e) => e.id !== expense.id))

    const { error } = await createClient()
      .from("expenses")
      .delete()
      .eq("id", expense.id)

    if (error) {
      setExpenses((atuais) => [...atuais, expense])
      toast.error(`Não deu para remover: ${error.message}`)
      return
    }
    toast.success("Despesa removida")
  }

  const ehMesAtual = mes === mesAtual()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Finanças" />

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => irPara(somarMeses(mes, -1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-44 text-center font-pixel text-[10px] tracking-[1px] uppercase">
            {rotuloDoMes(mes)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => irPara(somarMeses(mes, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" />
          </Button>
          {!ehMesAtual && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => irPara(mesAtual())}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <RotateCcw className="size-3.5" />
              Mês atual
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Numero rotulo="Proventos" valor={resumo.proventos} />
          <Numero
            rotulo="Despesas"
            valor={resumo.despesas}
            apoio={
              resumo.faltaPagar > 0
                ? `falta pagar ${formatarReal(resumo.faltaPagar)}`
                : linhas.length > 0
                  ? "tudo pago"
                  : undefined
            }
          />
          <Numero rotulo="Saldo" valor={resumo.saldo} destaque />
        </div>

        {resumo.despesas > 0 && (
          <BarraPago pago={resumo.pago} total={resumo.despesas} />
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-pixel text-[9px] tracking-[1px] text-muted-foreground uppercase">
              Despesas
            </h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEmEdicao(null)
                setDialogAberto(true)
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="size-3.5" />
              Nova despesa
            </Button>
          </div>

          {linhas.length === 0 ? (
            <p className="border-2 border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
              Nenhuma despesa neste mês.
            </p>
          ) : (
            <div className="space-y-1.5">
              {linhas.map((linha) => (
                <ExpenseRow
                  key={linha.expense.id}
                  linha={linha}
                  onTogglePago={() => togglePago(linha.expense, linha.valor)}
                  onEditar={() => {
                    setEmEdicao(linha.expense)
                    setDialogAberto(true)
                  }}
                  onRemover={() => setParaRemover(linha.expense)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-pixel text-[9px] tracking-[1px] text-muted-foreground uppercase">
            Proventos
          </h2>
          <IncomeBlock incomes={proventos} mes={mes} onChange={setIncomes} />
        </section>
      </div>

      <ExpenseDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        expense={emEdicao}
        mes={mes}
        onSaved={(expense, novo) => {
          setExpenses((atuais) =>
            novo
              ? [...atuais, expense]
              : atuais.map((e) => (e.id === expense.id ? expense : e))
          )
          toast.success(novo ? "Despesa criada" : "Despesa atualizada")
        }}
      />

      <AlertDialog
        open={paraRemover !== null}
        onOpenChange={(aberto) => !aberto && setParaRemover(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              {paraRemover?.description} sai de todos os meses, junto com o
              histórico de pagamentos dela. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => paraRemover && removerDespesa(paraRemover)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Numero({
  rotulo,
  valor,
  apoio,
  destaque,
}: {
  rotulo: string
  valor: number
  apoio?: string
  destaque?: boolean
}) {
  return (
    <div className={`border-2 p-4 retro-shadow ${destaque ? "border-[#2d6b3f] bg-[#0d1a12]" : "border-border bg-retro-panel"}`}>
      <p className="font-pixel text-[8px] tracking-[1px] text-muted-foreground uppercase">
        {rotulo}
      </p>
      <p
        className={`mt-2 font-pixel text-[17px] tabular-nums ${
          destaque && valor >= 0 ? "text-retro-green" : destaque && valor < 0 ? "text-destructive" : ""
        }`}
      >
        {formatarReal(valor)}
      </p>
      {apoio && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{apoio}</p>
      )}
    </div>
  )
}

function BarraPago({ pago, total }: { pago: number; total: number }) {
  const pct = Math.round((pago / total) * 100)
  const blocos = 10
  const cheios = Math.round((pago / total) * blocos)

  return (
    <div>
      <div className="mb-2 flex items-center gap-2.5">
        <span className="font-pixel text-[8px] tracking-[1px] text-muted-foreground uppercase">
          Pago no mês
        </span>
        <span className="font-pixel text-[8px] text-retro-green">{pct}%</span>
      </div>
      <div aria-hidden className="flex gap-[3px]">
        {Array.from({ length: blocos }, (_, i) => (
          <span
            key={i}
            className={`h-3.5 flex-1 ${i < cheios ? "bg-retro-green" : "bg-[#1b1f3d]"}`}
          />
        ))}
      </div>
    </div>
  )
}
