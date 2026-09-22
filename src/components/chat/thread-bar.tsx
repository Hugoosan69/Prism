"use client"

/** Barra de conversas: nova conversa e as recentes, sem sair da tela. */

import Link from "next/link"
import { MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"

type ThreadSummary = { id: string; title: string; updated_at: string }

export function ThreadBar({
  threads,
  activeId,
}: {
  threads: ThreadSummary[]
  activeId: string | null
}) {
  return (
    <div className="mb-3 flex shrink-0 items-center gap-2 overflow-x-auto pb-1">
      <Button size="xs" variant="outline" render={<Link href="/chat" />}>
        <MessageSquarePlus className="size-3" />
        Nova
      </Button>

      {threads.map((thread) => (
        <Link
          key={thread.id}
          href={`/chat?thread=${thread.id}`}
          className={`max-w-56 shrink-0 truncate rounded-full border px-2.5 py-1 text-xs transition-colors ${
            thread.id === activeId
              ? "border-transparent bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {thread.title || "Sem título"}
        </Link>
      ))}
    </div>
  )
}
