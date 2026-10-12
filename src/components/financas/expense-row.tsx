"use client"

/**
 * Uma despesa dentro de um mês.
 *
 * O toggle de pago é o gesto principal do módulo e tem de ser um clique: a
 * linha inteira é o botão. Por isso editar e remover ficam em ícones à
 * direita, com `stopPropagation` — clicar neles não pode marcar a conta como
 * paga sem querer.
 */

import { Check, Pencil, Trash2 } from "lucide-react"
import { formatarReal, type LinhaDoMes } from "@/lib/financas"
import { EXPENSE_KIND_LABELS, type ExpenseKind } from "@/lib/types"

export function ExpenseRow({
  linha,
  onTogglePago,
  onEditar,
  onRemover,
}: {
  linha: LinhaDoMes
  onTogglePago: () => void
  onEditar: () => void
  onRemover: () => void
}) {
  const { expense, pago, valor, parcela } = linha
  const faltam = parcela ? parcela.total - parcela.numero : 0

  return (
    <div
      className={`group/row flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
        pago ? "bg-muted/40" : "hover:bg-muted/40"
      }`}
    >
      <button
        onClick={onTogglePago}
        aria-label={pago ? `Desmarcar ${expense.description}` : `Marcar ${expense.description} como paga`}
        aria-pressed={pago}
        className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          pago
            ? "border-spec-financas bg-spec-financas text-background"
            : "border-muted-foreground/40 hover:border-foreground"
        }`}
      >
        {pago && <Check className="size-3.5" strokeWidth={3} />}
      </button>

      <button
        onClick={onTogglePago}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm ${pago ? "text-muted-foreground line-through" : ""}`}
          >
            {expense.description}
          </p>
          <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span>{EXPENSE_KIND_LABELS[expense.kind as ExpenseKind] ?? expense.kind}</span>
            {parcela && (
              <span>
                parcela {parcela.numero}/{parcela.total}
                {faltam > 0 && ` · faltam ${faltam}`}
              </span>
            )}
          </p>
        </div>
        <span
          className={`shrink-0 font-mono text-sm tabular-nums ${
            pago ? "text-muted-foreground" : ""
          }`}
        >
          {formatarReal(valor)}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEditar()
          }}
          aria-label={`Editar ${expense.description}`}
          className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-foreground focus-visible:opacity-100 group-hover/row:opacity-100 max-md:opacity-100"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemover()
          }}
          aria-label={`Remover ${expense.description}`}
          className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive focus-visible:opacity-100 group-hover/row:opacity-100 max-md:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
