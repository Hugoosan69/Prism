"use client"

import { useState } from "react"
import { Brain, ChevronRight, Copy, Check } from "lucide-react"
import { MarkdownPreview } from "@/components/notes/markdown-preview"
import { ProposalCard } from "./proposal-card"
import { TOOL_LABELS, type Message } from "./types"

export function MessageBubble({
  message,
  pending,
  onResolveProposal,
}: {
  message: Message
  /** Resposta ainda em curso: a bolha mostra sinal de vida, não vazio. */
  pending?: boolean
  onResolveProposal: (id: string, status: "aceita" | "recusada") => void
}) {
  const [showReasoning, setShowReasoning] = useState(false)
  const [copied, setCopied] = useState(false)

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-[15px] whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Área de transferência bloqueada: o botão só não confirma.
    }
  }

  return (
    <div className="group/msg space-y-2.5">
      {message.reasoning && (
        <div>
          <button
            onClick={() => setShowReasoning((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Brain className="size-3" />
            Raciocínio
            <ChevronRight
              className={`size-3 transition-transform ${showReasoning ? "rotate-90" : ""}`}
            />
          </button>
          {showReasoning && (
            <p className="mt-2 border-l-2 pl-3 text-xs whitespace-pre-wrap text-muted-foreground">
              {message.reasoning}
            </p>
          )}
        </div>
      )}

      {message.content ? (
        <div className="text-[15px] leading-relaxed">
          <MarkdownPreview content={message.content} />
        </div>
      ) : pending ? (
        // O modelo leva de 10 a 20 segundos para o primeiro token. Sem isto a
        // bolha fica vazia todo esse tempo, o que parece travamento — e leva a
        // clicar no botão de parar achando que é enviar.
        <Pensando reasoning={message.reasoning} />
      ) : (
        <p className="text-[13px] text-muted-foreground italic">
          Sem resposta — a geração foi interrompida.
        </p>
      )}

      {message.proposals?.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onResolve={onResolveProposal}
        />
      ))}

      <div className="flex items-center gap-3">
        {message.content && (
          <button
            onClick={copy}
            aria-label="Copiar resposta"
            className="text-muted-foreground opacity-0 transition hover:text-foreground focus-visible:opacity-100 group-hover/msg:opacity-100"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        )}
        {message.usedTools && message.usedTools.length > 0 && (
          <p className="font-mono text-[11px] text-muted-foreground">
            {message.usedTools
              .map((tool) => TOOL_LABELS[tool] ?? tool)
              .join(" · ")}
          </p>
        )}
      </div>
    </div>
  )
}

/** Sinal de vida enquanto o modelo pensa, mostrando o raciocínio que já chegou. */
function Pensando({ reasoning }: { reasoning?: string }) {
  const ultimo = reasoning?.trim().split("\n").at(-1) ?? ""

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex gap-1">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </span>
        Pensando
      </p>
      {ultimo && (
        <p className="line-clamp-2 border-l-2 pl-3 text-xs text-muted-foreground/80">
          {ultimo}
        </p>
      )}
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
      style={{ animationDelay: delay }}
    />
  )
}
