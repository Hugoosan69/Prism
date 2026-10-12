"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import {
  EXPENSE_KINDS,
  EXPENSE_KIND_LABELS,
  EXPENSE_RECURRENCES,
  EXPENSE_RECURRENCE_HINTS,
  EXPENSE_RECURRENCE_LABELS,
  type Expense,
  type ExpenseKind,
  type ExpenseRecurrence,
} from "@/lib/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
  /** Mês visível: vira o mês de início sugerido ao criar. */
  mes: string
  onSaved: (expense: Expense, novo: boolean) => void
}

/** "1.013,50" ou "1013.5" -> 1013.5. Vazio e lixo viram NaN. */
function paraNumero(texto: string): number {
  const limpo = texto.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
  return limpo === "" ? NaN : Number(limpo)
}

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  mes,
  onSaved,
}: Props) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [kind, setKind] = useState<ExpenseKind>("fixa")
  const [recurrence, setRecurrence] = useState<ExpenseRecurrence>("mensal")
  const [startMonth, setStartMonth] = useState("")
  const [installments, setInstallments] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setDescription(expense?.description ?? "")
    setAmount(expense ? String(expense.amount).replace(".", ",") : "")
    setKind((expense?.kind as ExpenseKind) ?? "fixa")
    setRecurrence((expense?.recurrence as ExpenseRecurrence) ?? "mensal")
    // O input month quer "YYYY-MM"; a coluna guarda "YYYY-MM-01".
    setStartMonth((expense?.start_month ?? mes).slice(0, 7))
    setInstallments(expense?.installments_total?.toString() ?? "")
    setNotes(expense?.notes ?? "")
  }, [open, expense, mes])

  async function salvar() {
    const valor = paraNumero(amount)
    if (!description.trim()) {
      toast.error("Informe a descrição.")
      return
    }
    if (Number.isNaN(valor) || valor < 0) {
      toast.error("Informe um valor válido.")
      return
    }
    if (!/^\d{4}-\d{2}$/.test(startMonth)) {
      toast.error("Informe o mês de início.")
      return
    }
    const parcelas = recurrence === "parcelada" ? Number(installments) : null
    if (recurrence === "parcelada" && (!parcelas || parcelas < 1)) {
      toast.error("Informe quantas parcelas.")
      return
    }

    setSaving(true)
    const supabase = createClient()
    const payload = {
      description: description.trim(),
      amount: valor,
      kind,
      recurrence,
      start_month: `${startMonth}-01`,
      // O banco recusa parcelas fora de "parcelada" (constraint
      // parcelas_coerentes); limpar aqui evita o erro virar toast genérico.
      installments_total: parcelas,
      notes: notes.trim(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = expense
      ? await supabase
          .from("expenses")
          .update(payload)
          .eq("id", expense.id)
          .select()
          .single()
      : await supabase.from("expenses").insert(payload).select().single()

    setSaving(false)
    if (error || !data) {
      toast.error(`Não deu para salvar: ${error?.message ?? "erro desconhecido"}`)
      return
    }

    onSaved(data as Expense, !expense)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90svh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar despesa" : "Nova despesa"}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1">
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs">
              Descrição
            </Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Internet"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="valor" className="text-xs">
                Valor
              </Label>
              <Input
                id="valor"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="134,00"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inicio" className="text-xs">
                Mês de início
              </Label>
              <Input
                id="inicio"
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <div className="flex gap-2">
              {EXPENSE_KINDS.map((k) => (
                <Escolha
                  key={k}
                  ativo={kind === k}
                  onClick={() => setKind(k)}
                  rotulo={EXPENSE_KIND_LABELS[k]}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Recorrência</Label>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_RECURRENCES.map((r) => (
                <Escolha
                  key={r}
                  ativo={recurrence === r}
                  onClick={() => setRecurrence(r)}
                  rotulo={EXPENSE_RECURRENCE_LABELS[r]}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {EXPENSE_RECURRENCE_HINTS[recurrence]}
            </p>
          </div>

          {recurrence === "parcelada" && (
            <div className="space-y-1.5">
              <Label htmlFor="parcelas" className="text-xs">
                Número de parcelas
              </Label>
              <Input
                id="parcelas"
                inputMode="numeric"
                value={installments}
                onChange={(e) => setInstallments(e.target.value.replace(/\D/g, ""))}
                placeholder="10"
                className="font-mono"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="obs" className="text-xs">
              Observação
            </Label>
            {/* field-sizing-fixed: sem isso o Textarea cresce sem teto e empurra
                o rodapé do diálogo para fora da tela. */}
            <Textarea
              id="obs"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field-sizing-fixed h-16 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Escolha({
  ativo,
  onClick,
  rotulo,
}: {
  ativo: boolean
  onClick: () => void
  rotulo: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
        ativo
          ? "border-foreground/30 bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {rotulo}
    </button>
  )
}
