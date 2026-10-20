"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  Send,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { ConversationFilters } from "./conversation-filters"
import { ConversationThread } from "./conversation-thread"

type StatusFilter = "open" | "pending" | "resolved"

type Inbox = { id: number; name: string; channel_type: string }

type ConversationMeta = {
  sender: { id: number; name: string; thumbnail?: string | null }
  channel?: string
  assignee?: { id: number; name: string } | null
}

type Conversation = {
  id: number
  inbox_id: number
  status: StatusFilter
  unread_count: number
  last_activity_at: number
  last_non_activity_message?: {
    content: string | null
    created_at: number
  } | null
  meta: ConversationMeta
}

type Message = {
  id: number
  content: string | null
  message_type: number
  created_at: number
  private: boolean
  sender?: { name?: string; type?: string } | null
}

function channelIcon(channel?: string) {
  if (!channel) return <MessageCircle className="size-4" />
  const ch = channel.toLowerCase()
  if (ch.includes("email") || ch.includes("mail"))
    return <Mail className="size-4" />
  if (ch.includes("whatsapp"))
    return <MessageCircle className="size-4 text-green-500" />
  return <MessageCircle className="size-4" />
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000 - ts)
  if (diff < 60) return "agora"
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export function ChatwootInbox({
  integrationId,
}: {
  integrationId: string
}) {
  const supabase = createClient()

  const [inboxes, setInboxes] = useState<Inbox[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusFilter>("open")
  const [selectedInbox, setSelectedInbox] = useState<number | null>(null)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [selectedMeta, setSelectedMeta] = useState<ConversationMeta | null>(
    null,
  )
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("open")

  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)

  const call = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      const { data, error } = await supabase.functions.invoke("conectar", {
        body: { action, kind: "integration", id: integrationId, ...extra },
      })
      if (error || data?.error)
        throw new Error(data?.error ?? "Falha na chamada ao Chatwoot.")
      return data
    },
    [supabase, integrationId],
  )

  const loadInboxes = useCallback(async () => {
    try {
      const data = await call("chatwoot-inboxes")
      setInboxes(data.inboxes ?? [])
    } catch {
      // silently fail — inboxes are optional for filtering
    }
  }, [call])

  const loadConversations = useCallback(async () => {
    setLoading(true)
    try {
      const data = await call("chatwoot-conversations", {
        status,
        ...(selectedInbox ? { inboxId: selectedInbox } : {}),
      })
      const payload = data?.data?.payload ?? data?.data ?? []
      setConversations(payload)
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erro ao carregar conversas.",
      )
    } finally {
      setLoading(false)
    }
  }, [call, status, selectedInbox])

  useEffect(() => {
    loadInboxes()
  }, [loadInboxes])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  async function selectConversation(id: number) {
    setSelectedId(id)
    setLoadingMsgs(true)
    const conv = conversations.find((c) => c.id === id)
    if (conv) {
      setSelectedMeta(conv.meta)
      setSelectedStatus(conv.status)
    }
    try {
      const data = await call("chatwoot-conversation", { conversationId: id })
      setMessages(data.messages ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar mensagens.")
    } finally {
      setLoadingMsgs(false)
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selectedId) return
    setSending(true)
    const text = reply.trim()
    setReply("")

    const optimistic: Message = {
      id: Date.now(),
      content: text,
      message_type: 1,
      created_at: Math.floor(Date.now() / 1000),
      private: false,
      sender: { name: "Você", type: "User" },
    }
    setMessages((m) => [...m, optimistic])

    try {
      const msg = await call("chatwoot-send", {
        conversationId: selectedId,
        text,
      })
      setMessages((m) => m.map((x) => (x.id === optimistic.id ? msg : x)))
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Não foi possível enviar.",
      )
      setMessages((m) => m.filter((x) => x.id !== optimistic.id))
      setReply(text)
    } finally {
      setSending(false)
    }
  }

  async function toggleStatus(newStatus: StatusFilter) {
    if (!selectedId) return
    try {
      await call("chatwoot-toggle-status", {
        conversationId: selectedId,
        status: newStatus,
      })
      setSelectedStatus(newStatus)
      setConversations((cs) =>
        cs.map((c) => (c.id === selectedId ? { ...c, status: newStatus } : c)),
      )
      toast.success(
        newStatus === "resolved" ? "Conversa resolvida." : "Conversa reaberta.",
      )
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Não foi possível alterar o status.",
      )
    }
  }

  function goBack() {
    setSelectedId(null)
    setMessages([])
    setSelectedMeta(null)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-sm)]">
      {/* Painel esquerdo: lista de conversas */}
      <div
        className={cn(
          "flex w-full flex-col border-r border-border sm:w-80 sm:shrink-0",
          selectedId !== null && "hidden sm:flex",
        )}
      >
        <ConversationFilters
          status={status}
          onStatusChange={(s) => {
            setStatus(s)
            setSelectedId(null)
          }}
          inboxes={inboxes}
          selectedInbox={selectedInbox}
          onInboxChange={setSelectedInbox}
        />

        <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
          <span className="text-xs text-muted-foreground">
            {conversations.length} conversa{conversations.length !== 1 && "s"}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={loadConversations}
            disabled={loading}
          >
            <RefreshCw
              className={cn("size-3.5", loading && "animate-spin")}
            />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nenhuma conversa {status === "open" ? "aberta" : status === "pending" ? "pendente" : "resolvida"}.
            </p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={cn(
                  "flex w-full items-start gap-2.5 border-b border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                  selectedId === c.id && "bg-muted/70",
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {channelIcon(c.meta.channel)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-sm font-medium">
                      {c.meta.sender.name || `#${c.id}`}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {timeAgo(c.last_activity_at)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.last_non_activity_message?.content || "Sem mensagem"}
                  </p>
                </div>
                {c.unread_count > 0 && (
                  <span className="mt-1 shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {c.unread_count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Painel direito: thread */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          selectedId === null && "hidden sm:flex",
        )}
      >
        {selectedId === null ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Selecione uma conversa
          </div>
        ) : (
          <>
            {/* Header da conversa */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Button
                variant="ghost"
                size="icon-sm"
                className="sm:hidden"
                onClick={goBack}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {selectedMeta?.sender.name || `Conversa #${selectedId}`}
                </p>
                {selectedMeta?.channel && (
                  <p className="text-[11px] text-muted-foreground">
                    {selectedMeta.channel.replace("Channel::", "")}
                    {selectedMeta.assignee
                      ? ` · ${selectedMeta.assignee.name}`
                      : ""}
                  </p>
                )}
              </div>
              {selectedStatus === "open" || selectedStatus === "pending" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => toggleStatus("resolved")}
                >
                  <CheckCircle2 className="size-3.5" />
                  Resolver
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => toggleStatus("open")}
                >
                  <CircleDot className="size-3.5" />
                  Reabrir
                </Button>
              )}
            </div>

            {/* Mensagens */}
            {loadingMsgs ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ConversationThread messages={messages} />
            )}

            {/* Campo de resposta */}
            <form
              className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2"
              onSubmit={(e) => {
                e.preventDefault()
                sendReply()
              }}
            >
              <Input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Responder..."
                className="flex-1"
                disabled={sending}
              />
              <Button
                type="submit"
                size="sm"
                className="gap-1"
                disabled={sending || !reply.trim()}
              >
                {sending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                Enviar
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
