import type { Tables } from "./database.types"

export type Task = Tables<"tasks">
export type Attachment = Tables<"attachments">
export type Snippet = Tables<"snippets">
export type Note = Tables<"notes">
export type Folder = Tables<"folders">
export type LinkItem = Tables<"links">
export type Bookmark = Tables<"bookmarks">
export type Memory = Tables<"memories">
export type ChatThread = Tables<"chat_threads">
export type ChatMessageRow = Tables<"chat_messages">
export type Expense = Tables<"expenses">
export type ExpensePayment = Tables<"expense_payments">
export type Income = Tables<"incomes">

export type ExpenseKind = "fixa" | "variavel"
export type ExpenseRecurrence = "mensal" | "parcelada" | "unica"

export const EXPENSE_KINDS: ExpenseKind[] = ["fixa", "variavel"]
export const EXPENSE_RECURRENCES: ExpenseRecurrence[] = [
  "mensal",
  "parcelada",
  "unica",
]

export const EXPENSE_KIND_LABELS: Record<ExpenseKind, string> = {
  fixa: "Fixa",
  variavel: "Variável",
}

export const EXPENSE_RECURRENCE_LABELS: Record<ExpenseRecurrence, string> = {
  mensal: "Todo mês",
  parcelada: "Parcelada",
  unica: "Uma vez",
}

/** Explica a recorrência onde o nome não basta (dica no diálogo). */
export const EXPENSE_RECURRENCE_HINTS: Record<ExpenseRecurrence, string> = {
  mensal: "Entra em todo mês a partir do mês de início",
  parcelada: "Entra do mês de início até acabarem as parcelas",
  unica: "Entra só no mês de início",
}

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
