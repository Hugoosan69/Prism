"use client"

/**
 * O que o assistente sabe, numa lista que dá para editar e apagar.
 *
 * Memória entra no prompt de toda pergunta, então um fato errado guardado aqui
 * contamina todas as respostas seguintes — e sem esta tela não haveria como
 * descobrir que ele existe, muito menos corrigi-lo.
 */

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Brain, Trash2 } from "lucide-react"
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
        Nada guardado ainda. Quando você corrigir o assistente ou explicar um
        termo do seu trabalho, ele oferece guardar — e o que for guardado
        aparece aqui.
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
            <Brain className="size-3 shrink-0 text-muted-foreground" />
            <span className="text-xs font-medium">{memoria.subject}</span>
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
