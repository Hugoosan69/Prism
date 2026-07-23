"use client"

import { useEffect, useRef, useState } from "react"
import { Download, Loader2, Paperclip, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { formatBytes } from "@/lib/utils"
import type { Attachment, Task, TaskPriority, TaskStatus } from "@/lib/types"
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  nextPosition: number
  onSaved: (task: Task, isNew: boolean) => void
  onDeleted: (id: string) => void
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  nextPosition,
  onSaved,
  onDeleted,
}: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatus>("todo")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [dueDate, setDueDate] = useState("")
  const [tags, setTags] = useState("")
  const [saving, setSaving] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? "")
    setDescription(task?.description ?? "")
    setStatus((task?.status as TaskStatus) ?? "todo")
    setPriority((task?.priority as TaskPriority) ?? "medium")
    setDueDate(task?.due_date ?? "")
    setTags(task?.tags.join(", ") ?? "")
    setAttachments([])
    if (task) {
      const supabase = createClient()
      supabase
        .from("attachments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at")
        .then(({ data }) => setAttachments(data ?? []))
    }
  }, [open, task])

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Informe um título.")
      return
    }
    setSaving(true)
    const supabase = createClient()

    const payload = {
      title: title.trim(),
      description,
      status,
      priority,
      due_date: dueDate || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      completed_at:
        status === "done"
          ? (task?.completed_at ?? new Date().toISOString())
          : null,
    }

    const { data, error } = task
      ? await supabase
          .from("tasks")
          .update(payload)
          .eq("id", task.id)
          .select()
          .single()
      : await supabase
          .from("tasks")
          .insert({ ...payload, position: nextPosition })
          .select()
          .single()

    setSaving(false)
    if (error || !data) {
      toast.error("Erro ao salvar a tarefa.")
      return
    }
    onSaved(data, !task)
    onOpenChange(false)
  }

  async function handleDelete() {
    if (!task) return
    const supabase = createClient()
    const { error } = await supabase.from("tasks").delete().eq("id", task.id)
    if (error) {
      toast.error("Erro ao excluir a tarefa.")
      return
    }
    onDeleted(task.id)
    onOpenChange(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !task) return
    setUploading(true)
    const supabase = createClient()
    const path = `tasks/${task.id}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from("files")
      .upload(path, file)

    if (uploadError) {
      toast.error("Erro ao enviar o anexo.")
      setUploading(false)
      return
    }

    const { data, error } = await supabase
      .from("attachments")
      .insert({
        task_id: task.id,
        name: file.name,
        storage_path: path,
        size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    setUploading(false)
    if (error || !data) {
      toast.error("Erro ao registrar o anexo.")
      return
    }
    setAttachments((prev) => [...prev, data])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleDownload(attachment: Attachment) {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from("files")
      .createSignedUrl(attachment.storage_path, 60)
    if (error || !data) {
      toast.error("Erro ao gerar o link de download.")
      return
    }
    window.open(data.signedUrl, "_blank")
  }

  async function handleRemoveAttachment(attachment: Attachment) {
    const supabase = createClient()
    await supabase.storage.from("files").remove([attachment.storage_path])
    const { error } = await supabase
      .from("attachments")
      .delete()
      .eq("id", attachment.id)
    if (error) {
      toast.error("Erro ao remover o anexo.")
      return
    }
    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Descrição</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_PRIORITY_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Prazo</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-tags">Tags (separadas por vírgula)</Label>
            <Input
              id="task-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="trabalho, urgente"
            />
          </div>

          {task && (
            <div className="space-y-2">
              <Label>Anexos</Label>
              <div className="space-y-1">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
                  >
                    <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{attachment.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(attachment.size)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDownload(attachment)}
                      title="Baixar"
                    >
                      <Download className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveAttachment(attachment)}
                      title="Remover"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Paperclip className="size-3.5" />
                  )}
                  Anexar arquivo
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-2">
          {task ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="ghost" size="sm" className="gap-1 text-destructive" />
                }
              >
                <Trash2 className="size-4" />
                Excluir
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A tarefa &quot;{task.title}&quot; e seus anexos serão
                    removidos. Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
