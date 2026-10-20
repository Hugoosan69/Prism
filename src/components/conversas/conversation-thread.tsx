"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type Message = {
  id: number
  content: string | null
  message_type: number // 0=incoming 1=outgoing 2=activity
  created_at: number
  private: boolean
  sender?: { name?: string; type?: string } | null
}

function timeOf(ts: number): string {
  return new Date(ts * 1000).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ConversationThread({
  messages,
  className,
}: {
  messages: Message[]
  className?: string
}) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  return (
    <div className={cn("flex-1 space-y-2 overflow-y-auto p-3", className)}>
      {messages.map((m) => {
        if (m.message_type === 2) {
          return (
            <div
              key={m.id}
              className="mx-auto max-w-md text-center text-[11px] text-muted-foreground"
            >
              {m.content}
            </div>
          )
        }

        const outgoing = m.message_type === 1
        return (
          <div
            key={m.id}
            className={cn(
              "flex",
              outgoing ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                m.private
                  ? "border border-dashed border-warning/40 bg-warning/10 text-warning-foreground"
                  : outgoing
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
              )}
            >
              {m.sender?.name && !outgoing && (
                <p className="mb-0.5 text-[11px] font-semibold opacity-70">
                  {m.sender.name}
                </p>
              )}
              {m.private && (
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                  Nota interna
                </p>
              )}
              <p className="whitespace-pre-wrap break-words">
                {m.content || "〈sem texto〉"}
              </p>
              <p
                className={cn(
                  "mt-1 text-right text-[10px] opacity-50",
                )}
              >
                {timeOf(m.created_at)}
              </p>
            </div>
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
