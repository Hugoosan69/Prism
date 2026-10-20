"use client"

import { cn } from "@/lib/utils"

type StatusFilter = "open" | "pending" | "resolved"

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "open", label: "Abertas" },
  { value: "pending", label: "Pendentes" },
  { value: "resolved", label: "Resolvidas" },
]

type Inbox = { id: number; name: string; channel_type: string }

export function ConversationFilters({
  status,
  onStatusChange,
  inboxes,
  selectedInbox,
  onInboxChange,
}: {
  status: StatusFilter
  onStatusChange: (s: StatusFilter) => void
  inboxes: Inbox[]
  selectedInbox: number | null
  onInboxChange: (id: number | null) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
      <div className="flex rounded-lg border border-border bg-muted/50">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={cn(
              "px-2.5 py-1 text-xs font-medium transition-colors",
              "first:rounded-l-md last:rounded-r-md",
              status === opt.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {inboxes.length > 1 && (
        <select
          className="h-7 rounded-md border border-input bg-muted/50 px-2 text-xs outline-none focus-visible:border-ring"
          value={selectedInbox ?? ""}
          onChange={(e) =>
            onInboxChange(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">Todos os canais</option>
          {inboxes.map((ib) => (
            <option key={ib.id} value={ib.id}>
              {ib.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
