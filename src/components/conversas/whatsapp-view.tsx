"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, RefreshCw, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// Conversas do WhatsApp lidas direto do WAHA (sem webhook ainda), via a edge
// function `conectar`. Painel duplo: lista de chats + thread com resposta.

type WahaChat = {
  id: unknown
  name?: string
  pushName?: string
  notifyName?: string
  lastMessage?: { body?: string; timestamp?: number } | null
}
type WahaMessage = {
  id?: unknown
  body?: string
  caption?: string
  fromMe?: boolean
  timestamp?: number
}

function idOf(raw: unknown): string {
  if (typeof raw === "string") return raw
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, string>
    return o._serialized || o.id || ""
  }
  return ""
}
function nameOf(c: WahaChat): string {
  return c.name || c.pushName || c.notifyName || idOf(c.id) || "Sem nome"
}
function textOf(m: WahaMessage): string {
  return m.body || m.caption || "〈mídia ou sem texto〉"
}
function timeOf(ts?: number): string {
  if (!ts) return ""
  return new Date(ts * 1000).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function WhatsappView({
  integrationId,
}: {
  integrationId: string
}) {
  const supabase = createClient()
  const [chats, setChats] = useState<WahaChat[]>([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<WahaMessage[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)

  const call = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      const { data, error } = await supabase.functions.invoke("conectar", {
        body: { action, kind: "integration", id: integrationId, ...extra },
      })
      if (error || data?.error) throw new Error(data?.error ?? "Falha no WAHA.")
      return data
    },
    [supabase, integrationId]
  )

  const loadChats = useCallback(async () => {
    setLoadingChats(true)
    try {
      const data = await call("waha-chats", { limit: 30 })
      setChats(Array.isArray(data?.chats) ? data.chats : [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar conversas.")
    } finally {
      setLoadingChats(false)
    }
  }, [call])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  const openChat = useCallback(
    async (chatId: string) => {
      setSelected(chatId)
      setLoadingMsgs(true)
      setMessages([])
      try {
        const data = await call("waha-messages", { chatId, limit: 50 })
        const list: WahaMessage[] = Array.isArray(data?.messages)
          ? data.messages
          : []
        // WAHA costuma devolver do mais novo ao mais antigo; mostro cronológico.
        setMessages([...list].reverse())
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao abrir a conversa.")
      } finally {
        setLoadingMsgs(false)
      }
    },
    [call]
  )

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight })
  }, [messages])

  async function send() {
    const text = reply.trim()
    if (!text || !selected) return
    setSending(true)
    try {
      await call("waha-send", { chatId: selected, text })
      setMessages((m) => [...m, { body: text, fromMe: true, timestamp: Date.now() / 1000 }])
      setReply("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100svh-11rem)] overflow-hidden rounded-xl border border-border bg-card">
      {/* Lista de chats */}
      <aside
        className={cn(
          "flex w-full flex-col border-r border-border sm:w-72",
          selected && "hidden sm:flex"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Conversas
          </span>
          <Button variant="ghost" size="icon-sm" onClick={loadChats} aria-label="Atualizar">
            <RefreshCw className={cn("size-3.5", loadingChats && "animate-spin")} />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Nenhuma conversa encontrada.
            </p>
          ) : (
            chats.map((c) => {
              const cid = idOf(c.id)
              return (
                <button
                  key={cid}
                  onClick={() => openChat(cid)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 border-b border-border/50 px-3 py-2 text-left transition-colors hover:bg-muted/50",
                    selected === cid && "bg-muted"
                  )}
                >
                  <span className="w-full truncate text-sm font-medium">
                    {nameOf(c)}
                  </span>
                  {c.lastMessage?.body && (
                    <span className="w-full truncate text-xs text-muted-foreground">
                      {c.lastMessage.body}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className={cn("flex min-w-0 flex-1 flex-col", !selected && "hidden sm:flex")}>
        {!selected ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Selecione uma conversa à esquerda.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-border px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden"
                onClick={() => setSelected(null)}
              >
                Voltar
              </Button>
              <span className="truncate text-sm font-medium">
                {nameOf(chats.find((c) => idOf(c.id) === selected) ?? { id: selected })}
              </span>
            </div>
            <div ref={threadRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Sem mensagens.
                </p>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idOf(m.id) || idx}
                    className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg px-3 py-1.5 text-sm",
                        m.fromMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="break-words whitespace-pre-wrap">{textOf(m)}</p>
                      <span
                        className={cn(
                          "mt-0.5 block text-[10px]",
                          m.fromMe
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {timeOf(m.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <Input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Mensagem"
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={sending || !reply.trim()}>
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
