"use client"

/**
 * O que o assistente sabe e como ele se comporta, numa lista que dá para editar
 * e apagar.
 *
 * Memória entra no prompt de toda pergunta, então um item errado guardado aqui
 * contamina todas as respostas seguintes — e sem esta tela não haveria como
 * descobrir que ele existe, muito menos corrigi-lo.
 *
 * Os dois grupos aparecem separados porque fazem coisas diferentes: **fato** é
 * o que ele sabe, **jeito** é quem ele é. Trocar um pelo outro é o erro fácil,
 * e é o que faz uma instrução de comportamento ser lida como curiosidade e
 * simplesmente não valer.
 */

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Brain, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import type { Memory } from "@/lib/types"

export function MemoryManager() {
  const [memorias, setMemorias] = useState<Memory[]>([])
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [rascunho, setRascunho] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("memories")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setMemorias(data ?? [])
        setCarregando(false)
      })
  }, [])

  async function apagar(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("memories").delete().eq("id", id)
    if (error) {
      toast.error("Não deu para esquecer isso.")
      return
    }
    setMemorias((prev) => prev.filter((m) => m.id !== id))
    toast.success("Esquecido.")
  }

  async function trocarTipo(id: string, atual: string) {
    const novo = atual === "jeito" ? "fato" : "jeito"
    const supabase = createClient()
    const { error } = await supabase
      .from("memories")
      .update({ kind: novo, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast.error("Não deu para mudar.")
      return
    }
    setMemorias((prev) =>
      prev.map((m) => (m.id === id ? { ...m, kind: novo } : m))
    )
    toast.success(
      novo === "jeito"
        ? "Virou jeito: passa a valer como instrução de comportamento."
        : "Virou fato: passa a valer como conhecimento."
    )
  }

  async function salvar(id: string) {
    const texto = rascunho.trim()
    if (!texto) return

    const supabase = createClient()
    const { error } = await supabase
      .from("memories")
      .update({ content: texto, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast.error("Não deu para corrigir.")
      return
    }
    setMemorias((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: texto } : m))
    )
    setEditando(null)
    toast.success("Memória corrigida.")
  }

  if (carregando) {
    return (
      <p className="text-xs text-muted-foreground">Carregando a memória…</p>
    )
  }

  if (memorias.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nada guardado ainda. Quando você explicar um termo do seu trabalho ou
        corrigir o jeito do assistente responder, ele oferece guardar — e o que
        for guardado aparece aqui.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {memorias.map((memoria) => (
        <div
          key={memoria.id}
          className="group/mem rounded-lg border bg-background p-3"
        >
          <div className="flex items-center gap-2">
            {memoria.kind === "jeito" ? (
              <Sparkles className="size-3 shrink-0 text-muted-foreground" />
            ) : (
              <Brain className="size-3 shrink-0 text-muted-foreground" />
            )}
            <span className="text-xs font-medium">{memoria.subject}</span>
            <button
              onClick={() => trocarTipo(memoria.id, memoria.kind)}
              title={
                memoria.kind === "jeito"
                  ? "Instrução de comportamento. Clique para tratar como conhecimento."
                  : "Conhecimento. Clique para tratar como instrução de comportamento."
              }
              className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground transition hover:text-foreground"
            >
              {memoria.kind === "jeito" ? "jeito" : "fato"}
            </button>
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(memoria.updated_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
            <button
              onClick={() => apagar(memoria.id)}
              aria-label={`Esquecer ${memoria.subject}`}
              className="ml-auto rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive focus-visible:opacity-100 group-hover/mem:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>

          {editando === memoria.id ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                className="field-sizing-fixed h-20 text-[13px]"
              />
              <div className="flex gap-2">
                <Button size="xs" onClick={() => salvar(memoria.id)}>
                  Salvar
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setEditando(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditando(memoria.id)
                setRascunho(memoria.content)
              }}
              className="mt-1 block w-full text-left text-[13px] text-muted-foreground hover:text-foreground"
            >
              {memoria.content}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
