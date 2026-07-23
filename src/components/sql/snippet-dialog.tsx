"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import type { Snippet } from "@/lib/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  snippet: Snippet | null
  onSaved: (snippet: Snippet, isNew: boolean) => void
  onDeleted: (id: string) => void
}

export function SnippetDialog({
  open,
  onOpenChange,
  snippet,
  onSaved,
  onDeleted,
}: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [code, setCode] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(snippet?.title ?? "")
    setDescription(snippet?.description ?? "")
    setCategory(snippet?.category ?? "")
    setTags(snippet?.tags.join(", ") ?? "")
    setCode(snippet?.code ?? "")
  }, [open, snippet])

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
      category: category.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      code,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = snippet
      ? await supabase
          .from("snippets")
          .update(payload)
          .eq("id", snippet.id)
          .select()
          .single()
      : await supabase.from("snippets").insert(payload).select().single()

    setSaving(false)
    if (error || !data) {
      toast.error("Erro ao salvar a consulta.")
      return
    }
    onSaved(data, !snippet)
    onOpenChange(false)
  }

  async function handleDelete() {
    if (!snippet) return
    const supabase = createClient()
    const { error } = await supabase
      .from("snippets")
      .delete()
      .eq("id", snippet.id)
    if (error) {
      toast.error("Erro ao excluir a consulta.")
      return
    }
    onDeleted(snippet.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {snippet ? "Editar consulta" : "Nova consulta"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="snippet-title">Título</Label>
              <Input
                id="snippet-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="snippet-category">Categoria</Label>
              <Input
                id="snippet-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="vendas, estoque..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="snippet-description">Descrição</Label>
            <Input
              id="snippet-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="snippet-tags">Tags (separadas por vírgula)</Label>
            <Input
              id="snippet-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="snippet-code">Código SQL</Label>
            <Textarea
              id="snippet-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              className="font-mono text-xs"
              spellCheck={false}
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          {snippet ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-destructive"
                  />
                }
              >
                <Trash2 className="size-4" />
                Excluir
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir consulta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A consulta &quot;{snippet.title}&quot; será removida. Essa
                    ação não pode ser desfeita.
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
