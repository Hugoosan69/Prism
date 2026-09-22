"use client"

/**
 * As diretrizes do assistente: a personalidade que Hugo escreve à mão.
 *
 * São a terceira e última camada de comportamento, e a que tem a palavra final.
 * Antes dela vêm a personalidade de partida (no SYSTEM_PROMPT, só muda com
 * commit) e as memórias do tipo "jeito" (que o assistente propõe quando é
 * corrigido no meio de uma conversa). Esta é a única que Hugo edita
 * diretamente, vê inteira e revisa quando quiser.
 *
 * O texto vai cru para o prompt, então o que está escrito aqui é literalmente
 * o que o modelo lê — daí os exemplos: escrever "seja útil" não muda nada,
 * escrever "não me explique o que eu já disse que sei" muda.
 */

import { useEffect, useState } from "react"
import { Check, Plus, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

/** Teto generoso, mas teto: isto entra no prompt de toda pergunta. */
const LIMITE = 2000

/** Atalhos para quem está com a página em branco na frente. */
const SUGESTOES = [
  "Resposta curta por padrão. Só detalhe se eu pedir.",
  "SQL do Winthor sempre em Oracle, palavras reservadas em maiúsculas.",
  "Quando eu citar uma rotina pelo número, já traga as tabelas envolvidas.",
  "Não repita o que eu acabei de dizer antes de responder.",
  "Se eu pedir algo que você não achou, diga o que procurou.",
]

export function AgentInstructionsForm() {
  const [texto, setTexto] = useState<string | null>(null)
  const [salvo, setSalvo] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data } = await createClient()
        .from("settings")
        .select("ai_instructions")
        .maybeSingle()

      setTexto(data?.ai_instructions ?? "")
      setSalvo(data?.ai_instructions ?? "")
    }
    // Erro ou tabela vazia caem num formulário em branco, que ainda dá para
    // usar — melhor que um "Carregando…" que nunca sai.
    carregar().catch(() => {
      setTexto("")
      setSalvo("")
    })
  }, [])

  async function salvar() {
    if (texto === null) return
    setSalvando(true)

    const { error } = await createClient()
      .from("settings")
      .upsert({
        id: true,
        ai_instructions: texto.slice(0, LIMITE),
        updated_at: new Date().toISOString(),
      })

    setSalvando(false)
    if (error) {
      toast.error("Não deu para salvar as diretrizes.")
      return
    }
    setSalvo(texto)
    toast.success("Diretrizes salvas. Valem na próxima mensagem.")
  }

  function adicionar(sugestao: string) {
    setTexto((atual) => {
      const base = (atual ?? "").trimEnd()
      if (base.includes(sugestao)) return base
      return base ? `${base}\n${sugestao}` : sugestao
    })
  }

  if (texto === null) {
    return <p className="text-xs text-muted-foreground">Carregando…</p>
  }

  const mudou = texto !== salvo
  const restante = LIMITE - texto.length

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, LIMITE))}
          placeholder={
            "Escreva como quer que ele trabalhe. Uma instrução por linha.\n\n" +
            "Ex.: Vá direto ao ponto.\n" +
            "Ex.: Quando eu citar um chamado, procure antes no Prism."
          }
          spellCheck={false}
          className="field-sizing-fixed h-44 resize-none text-[13px] leading-relaxed"
        />
        <span
          className={`pointer-events-none absolute right-3 bottom-2 font-mono text-[10px] ${
            restante < 150 ? "text-destructive" : "text-muted-foreground/60"
          }`}
        >
          {restante}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SUGESTOES.map((sugestao) => (
          <button
            key={sugestao}
            type="button"
            onClick={() => adicionar(sugestao)}
            disabled={texto.includes(sugestao)}
            className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-foreground/30 hover:text-foreground disabled:opacity-35 disabled:hover:border-border disabled:hover:text-muted-foreground"
          >
            <Plus className="size-3 shrink-0" />
            <span className="max-w-[16rem] truncate">{sugestao}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={salvar} disabled={salvando || !mudou} className="gap-2">
          <Check className="size-4" />
          {salvando ? "Salvando…" : "Salvar diretrizes"}
        </Button>
        {mudou && (
          <Button variant="ghost" size="sm" onClick={() => setTexto(salvo)}>
            <RotateCcw className="size-3.5" />
            Desfazer
          </Button>
        )}
      </div>
    </div>
  )
}
