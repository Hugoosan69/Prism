"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, Loader2, Square } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { MessageBubble } from "./message-bubble"
import { ThreadBar } from "./thread-bar"
import type { Message, Proposal, StreamEvent, ToolCall } from "./types"
import { TOOL_LABELS } from "./types"

type ThreadSummary = { id: string; title: string; updated_at: string }

type Props = {
  threads: ThreadSummary[]
  threadId: string | null
  initialMessages: Message[]
  /** Falso quando NVIDIA_API_KEY não existe; a tela explica em vez de quebrar. */
  enabled: boolean
}

const SUGGESTIONS = [
  "Qual consulta eu tenho para rejeição de GTIN?",
  "O que ficou pendente no meu Kanban?",
  "Resume o que o Segundo Cérebro guarda sobre Supabase",
]

export function ChatView({
  threads,
  threadId,
  initialMessages,
  enabled,
}: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [activity, setActivity] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const threadRef = useRef<string | null>(threadId)
  const loadedRef = useRef<string | null>(threadId)

  // Trocar de conversa recarrega a tela; um router.refresh() (que só existe
  // para atualizar a lista de conversas) não pode. Sem esta guarda, a resposta
  // recém-transmitida sumiria: a conversa nova ainda não está na URL que o Next
  // conhece, então initialMessages voltaria vazio.
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
   * Garante uma conversa no banco antes de gravar a primeira mensagem, e usa o
   * início da pergunta como título — o suficiente para reconhecer a conversa na
   * lista sem gastar uma chamada ao modelo só para nomear.
   */
  async function ensureThread(firstMessage: string) {
    if (threadRef.current) return threadRef.current

    const supabase = createClient()
    const title = firstMessage.slice(0, 70)
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({ title })
      .select("id")
      .single()

    if (error || !data) {
      toast.error("Não deu para criar a conversa; o histórico não será salvo.")
      return null
    }

    threadRef.current = data.id
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
      tool_calls: extras.toolCalls ? JSON.parse(JSON.stringify(extras.toolCalls)) : null,
    })
    await supabase
      .from("chat_threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id)
  }

  async function send(text: string) {
    const question = text.trim()
    if (!question || streaming) return

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

      await persist("assistant", content, { reasoning })
      // A lista de conversas do servidor fica velha depois de uma resposta.
      router.refresh()
    } catch (error) {
      if (controller.signal.aborted) {
        await persist("assistant", content, { reasoning })
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

  const empty = messages.length === 0

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col">
      <ThreadBar threads={threads} activeId={threadId} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
            <div>
              <h2 className="text-base font-medium">
                O que você quer saber?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pergunte sobre suas consultas, notas e tarefas — ou sobre o
                Segundo Cérebro.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => send(suggestion)}
                  disabled={!enabled}
                  className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 pb-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
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
        )}
      </div>

      <div className="shrink-0 pt-3">
        {!enabled && (
          <p className="mb-2 text-xs text-muted-foreground">
            Chat desligado: falta <code>NVIDIA_API_KEY</code> no{" "}
            <code>.env.local</code>.
          </p>
        )}
        <div className="flex items-end gap-2 rounded-xl border bg-card/40 p-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            disabled={!enabled}
            placeholder="Pergunte alguma coisa…  (Enter envia, Shift+Enter quebra linha)"
            // field-sizing-fixed + max-h: sem isso o Textarea do shadcn cresce
            // sem limite e empurra o botão de enviar para fora da tela.
            className="field-sizing-fixed max-h-40 min-h-9 resize-none border-0 bg-transparent px-1.5 py-1.5 focus-visible:ring-0"
            rows={1}
          />
          {streaming ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => abortRef.current?.abort()}
              aria-label="Parar"
            >
              <Square className="size-3.5" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={() => send(input)}
              disabled={!enabled || !input.trim()}
              aria-label="Enviar"
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
