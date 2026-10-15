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
      className={`group/row flex items-center gap-3 border-2 px-3 py-2.5 transition-colors ${
        pago ? "border-retro-border-muted bg-retro-surface-dim" : "border-retro-border-strong bg-retro-surface-sunken hover:bg-retro-elevated"
      }`}
    >
      <button
        onClick={onTogglePago}
        aria-label={pago ? `Desmarcar ${expense.description}` : `Marcar ${expense.description} como paga`}
        aria-pressed={pago}
        className={`flex size-5 shrink-0 items-center justify-center border-2 transition-colors ${
          pago
            ? "border-retro-green bg-retro-green text-primary-foreground"
            : "border-retro-kind-fixa hover:border-foreground"
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
          <p className="flex items-center gap-2 font-pixel text-[7px]">
            <span className={expense.kind === "variavel" ? "text-retro-cyan" : "text-retro-kind-fixa"}>
              {(EXPENSE_KIND_LABELS[expense.kind as ExpenseKind] ?? expense.kind).toUpperCase()}
            </span>
            {parcela && (
              <span className="border-2 border-retro-amber-border px-1.5 py-0.5 font-pixel text-[8px] text-retro-amber">
                {parcela.numero}/{parcela.total}
              </span>
            )}
          </p>
        </div>
        <span
          className={`shrink-0 font-pixel text-[10px] tabular-nums ${
            pago ? "text-retro-icon-muted" : ""
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
