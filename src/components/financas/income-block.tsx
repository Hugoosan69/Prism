"use client"

/**
 * Proventos do mês, com edição no próprio item.
 *
 * Sem diálogo: um provento tem três campos e quase sempre se mexe no valor.
 * Abrir uma janela para trocar um número seria mais clique do que o módulo
 * inteiro se propõe a custar.
 */

import { useState } from "react"
import { Check, Plus, Repeat, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { formatarReal } from "@/lib/financas"
import type { Income } from "@/lib/types"

/** "1.013,50" ou "1013.5" -> 1013.5. */
function paraNumero(texto: string): number {
  const limpo = texto.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
  return limpo === "" ? NaN : Number(limpo)
}

type Rascunho = { description: string; amount: string; recurring: boolean }

const VAZIO: Rascunho = { description: "", amount: "", recurring: false }

export function IncomeBlock({
  incomes,
  mes,
  onChange,
}: {
  /** Já filtrados para o mês pela tela. */
  incomes: Income[]
  mes: string
  onChange: (proximos: (atuais: Income[]) => Income[]) => void
}) {
  const [editando, setEditando] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const [rascunho, setRascunho] = useState<Rascunho>(VAZIO)
  const [salvando, setSalvando] = useState(false)

  function abrirEdicao(income: Income) {
    setCriando(false)
    setEditando(income.id)
    setRascunho({
      description: income.description,
      amount: String(income.amount).replace(".", ","),
      recurring: income.recurring,
    })
  }

  function fechar() {
    setEditando(null)
    setCriando(false)
    setRascunho(VAZIO)
  }

  async function salvar() {
    const valor = paraNumero(rascunho.amount)
    if (!rascunho.description.trim() || Number.isNaN(valor) || valor < 0) {
      toast.error("Informe descrição e valor.")
      return
    }

    setSalvando(true)
    const supabase = createClient()
    const payload = {
      description: rascunho.description.trim(),
      amount: valor,
      recurring: rascunho.recurring,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = editando
      ? await supabase
          .from("incomes")
          .update(payload)
          .eq("id", editando)
          .select()
          .single()
      : await supabase
          .from("incomes")
          .insert({ ...payload, month: mes })
          .select()
          .single()

    setSalvando(false)
    if (error || !data) {
      toast.error(`Não deu para salvar: ${error?.message ?? "erro desconhecido"}`)
      return
    }

    const salvo = data as Income
    onChange((atuais) =>
      editando
        ? atuais.map((i) => (i.id === salvo.id ? salvo : i))
        : [...atuais, salvo]
    )
    fechar()
  }

  async function remover(income: Income) {
    // Otimista: some da tela e volta se o banco recusar.
    onChange((atuais) => atuais.filter((i) => i.id !== income.id))
    const { error } = await createClient()
      .from("incomes")
      .delete()
      .eq("id", income.id)

    if (error) {
      onChange((atuais) => [...atuais, income])
      toast.error(`Não deu para remover: ${error.message}`)
    }
  }

  const formulario = (
    <div className="flex flex-wrap items-center gap-2 border-2 border-border bg-background p-2">
      <Input
        value={rascunho.description}
        onChange={(e) => setRascunho({ ...rascunho, description: e.target.value })}
        placeholder="Salário"
        autoFocus
        className="h-8 min-w-32 flex-1 text-sm"
      />
      <Input
        value={rascunho.amount}
        onChange={(e) => setRascunho({ ...rascunho, amount: e.target.value })}
        placeholder="5.100,00"
        inputMode="decimal"
        className="h-8 w-28 font-mono text-sm"
      />
      <button
        type="button"
        onClick={() => setRascunho({ ...rascunho, recurring: !rascunho.recurring })}
        aria-pressed={rascunho.recurring}
        title="Repete todo mês a partir deste"
        className={`flex items-center gap-1 border-2 border-border px-2 py-1 text-[11px] transition-colors ${
          rascunho.recurring
            ? "border-foreground/30 bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Repeat className="size-3" />
        Todo mês
      </button>
      <Button size="sm" onClick={salvar} disabled={salvando}>
        <Check className="size-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={fechar}>
        <X className="size-3.5" />
      </Button>
    </div>
  )

  return (
    <div className="space-y-2">
      {incomes.length === 0 && !criando && (
        <p className="text-xs text-muted-foreground">
          Nenhum provento neste mês.
        </p>
      )}

      {incomes.map((income) =>
        editando === income.id ? (
          <div key={income.id}>{formulario}</div>
        ) : (
          <div
            key={income.id}
            className="group/inc flex items-center gap-3 border-2 border-retro-border-muted bg-retro-surface-dim px-3 py-2 transition-colors hover:bg-retro-elevated"
          >
            <button
              onClick={() => abrirEdicao(income)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="min-w-0 flex-1 truncate text-sm">
                {income.description}
              </span>
              {income.recurring && (
                <Repeat
                  className="size-3 shrink-0 text-muted-foreground"
                  aria-label="Repete todo mês"
                />
              )}
              <span className="shrink-0 font-pixel text-[10px] tabular-nums text-retro-green">
                {formatarReal(income.amount)}
              </span>
            </button>
            <button
              onClick={() => remover(income)}
              aria-label={`Remover ${income.description}`}
              className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive focus-visible:opacity-100 group-hover/inc:opacity-100 max-md:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )
      )}

      {criando ? (
        formulario
      ) : (
        <button
          onClick={() => {
            setEditando(null)
            setRascunho(VAZIO)
            setCriando(true)
          }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Adicionar provento
        </button>
      )}
    </div>
  )
}
