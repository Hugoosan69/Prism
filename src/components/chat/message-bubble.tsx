"use client"

import { useState } from "react"
import { Brain, ChevronRight } from "lucide-react"
import { MarkdownPreview } from "@/components/notes/markdown-preview"
import { ProposalCard } from "./proposal-card"
import { TOOL_LABELS, type Message } from "./types"

export function MessageBubble({
  message,
  onResolveProposal,
}: {
  message: Message
  onResolveProposal: (id: string, status: "aceita" | "recusada") => void
}) {
  const [showReasoning, setShowReasoning] = useState(false)

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-xl bg-muted px-3 py-2 text-sm whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
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
            <p className="mt-1.5 border-l-2 pl-3 text-xs whitespace-pre-wrap text-muted-foreground">
              {message.reasoning}
            </p>
          )}
        </div>
      )}

      <MarkdownPreview content={message.content} />

      {message.proposals?.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onResolve={onResolveProposal}
        />
      ))}

      {message.usedTools && message.usedTools.length > 0 && (
        <p className="font-mono text-[11px] text-muted-foreground">
          {message.usedTools
            .map((tool) => TOOL_LABELS[tool] ?? tool)
            .join(" · ")}
        </p>
      )}
    </div>
  )
}
