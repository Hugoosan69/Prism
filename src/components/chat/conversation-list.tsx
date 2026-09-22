"use client"

/**
 * Coluna de conversas do chat.
 *
 * Agrupada por tempo em vez de uma lista corrida: quando as conversas viram
 * dezenas, "Hoje / Ontem / Últimos 7 dias" é o que faz achar a de ontem sem
 * ler título por título.
 */

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { isThisYear, isToday, isYesterday, differenceInDays } from "date-fns"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PenSquare, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export type ThreadSummary = {
  id: string
  title: string
  updated_at: string
}

function bucketOf(date: Date) {
  if (isToday(date)) return "Hoje"
  if (isYesterday(date)) return "Ontem"
  if (differenceInDays(new Date(), date) < 7) return "Últimos 7 dias"
  if (differenceInDays(new Date(), date) < 30) return "Últimos 30 dias"
  if (isThisYear(date)) return format(date, "MMMM", { locale: ptBR })
  return format(date, "MMMM 'de' yyyy", { locale: ptBR })
}

function group(threads: ThreadSummary[]) {
  const buckets = new Map<string, ThreadSummary[]>()
  for (const thread of threads) {
    const key = bucketOf(new Date(thread.updated_at))
    const list = buckets.get(key)
    if (list) list.push(thread)
    else buckets.set(key, [thread])
  }
  return [...buckets.entries()]
}

export function ConversationList({
  threads,
  activeId,
  onNavigate,
}: {
  threads: ThreadSummary[]
  activeId: string | null
  /** Fecha o painel no celular depois de escolher uma conversa. */
  onNavigate?: () => void
}) {
  const router = useRouter()
  const [removing, setRemoving] = useState<string | null>(null)

  async function remove(id: string) {
    setRemoving(id)
    const supabase = createClient()
    // As mensagens saem junto: chat_messages tem on delete cascade.
    const { error } = await supabase.from("chat_threads").delete().eq("id", id)

    if (error) {
      toast.error(`Não deu para apagar: ${error.message}`)
      setRemoving(null)
      return
    }

    toast.success("Conversa apagada")
    if (id === activeId) router.push("/chat")
    else router.refresh()
    setRemoving(null)
  }

  return (
    // min-w-0 em toda a cadeia: sem ele o item não encolhe abaixo do próprio
    // texto, o truncate não corta e o título empurra a caixa para fora da
    // coluna, passando por cima da borda.
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div className="p-3">
        <Link
          href="/chat"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          <PenSquare className="size-3.5 text-muted-foreground" />
          Nova conversa
        </Link>
      </div>

      <nav className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-2 pb-3">
        {threads.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            Nenhuma conversa ainda.
          </p>
        ) : (
          group(threads).map(([label, items]) => (
            <div key={label} className="mb-3 min-w-0">
              <p className="px-2 pb-1 text-[11px] font-medium text-muted-foreground capitalize">
                {label}
              </p>
              {items.map((thread) => (
                <div
                  key={thread.id}
                  className={`group/item flex min-w-0 items-center gap-1 rounded-lg pr-1 transition-colors ${
                    thread.id === activeId
                      ? "bg-muted"
                      : "hover:bg-muted/60"
                  }`}
                >
                  <Link
                    href={`/chat?thread=${thread.id}`}
                    onClick={onNavigate}
                    className="min-w-0 flex-1 truncate px-2 py-1.5 text-sm"
                    title={thread.title}
                  >
                    {thread.title || "Sem título"}
                  </Link>
                  <button
                    onClick={() => remove(thread.id)}
                    disabled={removing === thread.id}
                    aria-label={`Apagar conversa ${thread.title}`}
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive focus-visible:opacity-100 group-hover/item:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </nav>
    </div>
  )
}
