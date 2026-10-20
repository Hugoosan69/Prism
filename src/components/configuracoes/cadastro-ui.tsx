"use client"

import type { ReactNode } from "react"

/** Casca comum dos cadastros: título, descrição e espaço para a lista + form. */
export function CadastroSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3 rounded-xl border bg-card p-4">{children}</div>
    </section>
  )
}

const STATUS_TONES: Record<string, string> = {
  connected: "bg-success/15 text-success",
  ok: "bg-success/15 text-success",
  disconnected: "bg-muted text-muted-foreground",
  untested: "bg-muted text-muted-foreground",
  pending: "bg-warning/15 text-warning",
  error: "bg-destructive/15 text-destructive",
}

/** Pill de status (DESIGN §6): fundo do status a ~15% + texto sólido. */
export function StatusPill({ status, label }: { status: string; label: string }) {
  const tone = STATUS_TONES[status] ?? "bg-muted text-muted-foreground"
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}
    >
      {label}
    </span>
  )
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <p className="py-2 text-center text-xs text-muted-foreground">{children}</p>
  )
}
