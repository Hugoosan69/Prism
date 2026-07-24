import type { Tables } from "./database.types"

export type Task = Tables<"tasks">
export type Attachment = Tables<"attachments">
export type Snippet = Tables<"snippets">
export type Note = Tables<"notes">
export type Folder = Tables<"folders">
export type LinkItem = Tables<"links">
export type Bookmark = Tables<"bookmarks">

export type TaskStatus = "todo" | "doing" | "waiting" | "done"
export type TaskPriority = "low" | "medium" | "high"

/** Ordem do fluxo: da esquerda para a direita no quadro. */
export const TASK_STATUSES: TaskStatus[] = ["todo", "doing", "waiting", "done"]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "A Fazer",
  doing: "Fazendo",
  waiting: "Aguardando",
  done: "Concluído",
}

/** Explica o estágio onde ele não é óbvio (tooltip da coluna). */
export const TASK_STATUS_HINTS: Partial<Record<TaskStatus, string>> = {
  waiting: "Feito da sua parte, esperando validação ou retorno de alguém",
}

/** Ver os tokens --status-* em globals.css */
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "var(--status-todo)",
  doing: "var(--status-doing)",
  waiting: "var(--status-waiting)",
  done: "var(--status-done)",
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
}
