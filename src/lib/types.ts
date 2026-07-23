import type { Tables } from "./database.types"

export type Task = Tables<"tasks">
export type Attachment = Tables<"attachments">
export type Snippet = Tables<"snippets">
export type Note = Tables<"notes">
export type Folder = Tables<"folders">
export type FileItem = Tables<"files">
export type Bookmark = Tables<"bookmarks">

export type TaskStatus = "todo" | "doing" | "done"
export type TaskPriority = "low" | "medium" | "high"

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "A Fazer",
  doing: "Fazendo",
  done: "Concluído",
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
}
