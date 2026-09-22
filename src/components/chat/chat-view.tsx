"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MessagesSquare } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { Composer } from "./composer"
import { ConversationList, type ThreadSummary } from "./conversation-list"
import { MessageBubble } from "./message-bubble"
import { WelcomeScreen } from "./welcome-screen"
import type { Message, Proposal, StreamEvent, ToolCall } from "./types"
import { TOOL_LABELS } from "./types"

type Props = {
  threads: ThreadSummary[]
  threadId: string | null
  initialMessages: Message[]
  /** Falso quando a chave do modelo não existe; a tela explica em vez de quebrar. */
  enabled: boolean
  sources: { prism: boolean; cofre: boolean; web: boolean }
}

export function ChatView({
  threads,
  threadId,
  initialMessages,
  enabled,
  sources,
}: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [activity, setActivity] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  /** Id da resposta que está sendo gerada, para a bolha mostrar "Pensando". */
  const [pendingId, setPendingId] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const threadRef = useRef<string | null>(threadId)
  const loadedRef = useRef<string | null>(threadId)

  // Trocar de conversa recarrega a tela; um router.refresh() (que só existe
  // para atualizar a lista lateral) não pode. Sem esta guarda, a resposta
  // recém-transmitida sumiria: a conversa nova ainda não está na URL que o
  // Next conhece, então initialMessages voltaria vazio.
  useEffect(() => {
    if (loadedRef.current === threadId) return
    loadedRef.current = threadId
    threadRef.current = threadId
    setMessages(initialMessages)
  }, [threadId, initialMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, activity])

  /**
   * Garante uma conversa no banco antes de gravar a primeira mensagem, usando
   * o início da pergunta como título — suficiente para reconhecê-la na lista
   * sem gastar uma chamada ao modelo só para dar nome.
   */
  async function ensureThread(firstMessage: string) {
    if (threadRef.current) return threadRef.current

    const supabase = createClient()
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({ title: firstMessage.slice(0, 70) })
      .select("id")
      .single()

    if (error || !data) {
      toast.error("Não deu para criar a conversa; o histórico não será salvo.")
      return null
    }

    threadRef.current = data.id
    loadedRef.current = data.id
    // replaceState em vez de router.replace: navegar aqui remontaria a tela no
    // meio do streaming.
    window.history.replaceState(null, "", `/chat?thread=${data.id}`)
    return data.id
  }

  async function persist(
    role: "user" | "assistant",
    content: string,
    extras: { reasoning?: string; toolCalls?: ToolCall[] } = {}
  ) {
    const id = threadRef.current
    if (!id) return

    const supabase = createClient()
    await supabase.from("chat_messages").insert({
      thread_id: id,
      role,
      content,
      reasoning: extras.reasoning ?? "",
      tool_calls: extras.toolCalls
        ? JSON.parse(JSON.stringify(extras.toolCalls))
        : null,
    })
    await supabase
      .from("chat_threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id)
  }

  async function send(text: string) {
    const question = text.trim()
    if (!question || streaming || !enabled) return

    setInput("")
    setStreaming(true)
    setActivity(null)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    }
    const assistantId = crypto.randomUUID()
    const history = [...messages, userMessage]

    setMessages([
      ...history,
      { id: assistantId, role: "assistant", content: "", reasoning: "" },
    ])
    setPendingId(assistantId)

    await ensureThread(question)
    await persist("user", question)

    const controller = new AbortController()
    abortRef.current = controller

    let content = ""
    let reasoning = ""
    const usedTools: string[] = []
    const proposals: Proposal[] = []

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role,
            content: m.content,
            tool_calls: m.toolCalls,
            tool_call_id: m.toolCallId,
          })),
        }),
      })

      if (!response.ok || !response.body) {
        const detail = await response.json().catch(() => ({ error: "" }))
        throw new Error(detail.error || `Erro ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.trim()) continue

          let event: StreamEvent
          try {
            event = JSON.parse(line)
          } catch {
            continue
          }

          if (event.type === "content") {
            content += event.text
          } else if (event.type === "reasoning") {
            reasoning += event.text
          } else if (event.type === "tool") {
            setActivity(
              event.status === "running"
                ? (TOOL_LABELS[event.name] ?? event.name)
                : null
            )
            if (event.status === "running" && !usedTools.includes(event.name)) {
              usedTools.push(event.name)
            }
          } else if (event.type === "proposal") {
            proposals.push({
              id: event.id,
              tool: event.tool,
              args: event.args,
              status: "pendente",
            })
          } else if (event.type === "error") {
            toast.error(event.message)
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content,
                    reasoning,
                    usedTools: [...usedTools],
                    proposals: [...proposals],
                  }
                : m
            )
          )
        }
      }

      // Resposta vazia não vira registro: ao reabrir a conversa ela apareceria
      // como uma bolha morta, sem dizer o que houve.
      if (content.trim()) {
        await persist("assistant", content, { reasoning })
        router.refresh()
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        toast.error("O modelo não devolveu resposta. Tente de novo.")
      }
    } catch (error) {
      if (controller.signal.aborted) {
        if (content.trim()) {
          await persist("assistant", content, { reasoning })
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        }
      } else {
        const message =
          error instanceof Error ? error.message : "Falha ao responder."
        toast.error(message)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId && !m.content
              ? { ...m, content: `_${message}_` }
              : m
          )
        )
      }
    } finally {
      setStreaming(false)
      setActivity(null)
      setPendingId(null)
      abortRef.current = null
    }
  }

  function resolveProposal(
    messageId: string,
    proposalId: string,
    status: "aceita" | "recusada"
  ) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              proposals: m.proposals?.map((p) =>
                p.id === proposalId ? { ...p, status } : p
              ),
            }
          : m
      )
    )
  }

  const composer = (autoFocus: boolean, hint = false) => (
    <Composer
      value={input}
      onChange={setInput}
      onSend={() => send(input)}
      onStop={() => abortRef.current?.abort()}
      streaming={streaming}
      disabled={!enabled}
      sources={sources}
      autoFocus={autoFocus}
      hint={hint}
    />
  )

  return (
    <div className="flex min-h-0 flex-1">
      {/* No desktop a lista fica sempre à vista; no celular ela vira painel,
          senão o histórico simplesmente não existiria por lá. */}
      <aside className="hidden w-60 shrink-0 overflow-hidden border-r md:flex">
        <ConversationList threads={threads} activeId={threadId} />
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-3 pt-3 md:hidden">
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground"
          >
            <MessagesSquare className="size-3.5" />
            Conversas
          </button>

          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Conversas</SheetTitle>
                <SheetDescription>Histórico do chat.</SheetDescription>
              </SheetHeader>
              <div className="flex h-full flex-col">
                <ConversationList
                  threads={threads}
                  activeId={threadId}
                  onNavigate={() => setHistoryOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {messages.length === 0 ? (
          <WelcomeScreen
            enabled={enabled}
            onPick={send}
            composer={composer(true, true)}
          />
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              {/* justify-end + min-h-full: com poucas mensagens a conversa
                  encosta no composer em vez de ficar colada no topo, deixando
                  um vazio no meio da tela em monitor alto. */}
              <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end space-y-6 pt-8 pb-6">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    pending={message.id === pendingId}
                    onResolveProposal={(proposalId, status) =>
                      resolveProposal(message.id, proposalId, status)
                    }
                  />
                ))}
                {activity && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    {activity}…
                  </p>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="shrink-0 px-4 pb-4">
              <div className="mx-auto w-full max-w-3xl">{composer(false)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
