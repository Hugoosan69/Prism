"use client"

/**
 * Liga a escrita sem confirmação.
 *
 * É um interruptor e não uma frase nas diretrizes de propósito: comportamento
 * com consequência de segurança não deve ser inferido de linguagem natural. Um
 * texto do tipo "pode gravar sem me perguntar" é ambíguo para o modelo e, pior,
 * poderia aparecer dentro de uma nota ou página lida por ferramenta.
 */

import { useEffect, useState } from "react"
import { Zap } from "lucide-react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"

export function DirectActionSwitch() {
  const [ligado, setLigado] = useState<boolean | null>(null)

  useEffect(() => {
    async function carregar() {
      const { data } = await createClient()
        .from("settings")
        .select("acao_direta")
        .maybeSingle()
      setLigado(data?.acao_direta ?? false)
    }
    carregar().catch(() => setLigado(false))
  }, [])

  async function alternar(valor: boolean) {
    setLigado(valor)
    const { error } = await createClient()
      .from("settings")
      .upsert({
        id: true,
        acao_direta: valor,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      setLigado(!valor)
      toast.error("Não deu para salvar.")
      return
    }
    toast.success(
      valor
        ? "Ligado. Ele grava direto quando não tiver lido a web nem o cofre."
        : "Desligado. Toda escrita volta a passar pelo card."
    )
  }

  if (ligado === null) {
    return <p className="text-xs text-muted-foreground">Carregando…</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Label htmlFor="acao-direta" className="font-medium">
            Gravar sem pedir confirmação
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ordem clara vira tarefa, nota ou consulta na hora, sem card.
          </p>
        </div>
        <Switch id="acao-direta" checked={ligado} onCheckedChange={alternar} />
      </div>

      <p className="flex items-start gap-2 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
        <Zap className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Vale enquanto a resposta não tiver lido a <strong>web</strong> ou o{" "}
          <strong>cofre</strong>. Essas duas trazem texto que outra pessoa
          escreveu, e uma instrução plantada ali viraria comando — nesse caso o
          card volta, naquela resposta. O que ele gravar sozinho aparece no chat
          com botão de desfazer.
        </span>
      </p>
    </div>
  )
}
