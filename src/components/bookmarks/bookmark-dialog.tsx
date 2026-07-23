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
import { createClient } from "@/lib/supabase/client"
import type { Bookmark } from "@/lib/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark: Bookmark | null
  onSaved: (bookmark: Bookmark, isNew: boolean) => void
  onDeleted: (id: string) => void
}

export function BookmarkDialog({
  open,
  onOpenChange,
  bookmark,
  onSaved,
  onDeleted,
}: Props) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(bookmark?.title ?? "")
    setUrl(bookmark?.url ?? "")
    setDescription(bookmark?.description ?? "")
    setCategory(bookmark?.category ?? "")
  }, [open, bookmark])

  async function handleSave() {
    if (!title.trim() || !url.trim()) {
      toast.error("Informe título e URL.")
      return
    }
    setSaving(true)
    const supabase = createClient()

    const normalizedUrl = /^https?:\/\//.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`

    const payload = {
      title: title.trim(),
      url: normalizedUrl,
      description: description.trim(),
      category: category.trim(),
    }

    const { data, error } = bookmark
      ? await supabase
          .from("bookmarks")
          .update(payload)
          .eq("id", bookmark.id)
          .select()
          .single()
      : await supabase.from("bookmarks").insert(payload).select().single()

    setSaving(false)
    if (error || !data) {
      toast.error("Erro ao salvar o favorito.")
      return
    }
    onSaved(data, !bookmark)
    onOpenChange(false)
  }

  async function handleDelete() {
    if (!bookmark) return
    const supabase = createClient()
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmark.id)
    if (error) {
      toast.error("Erro ao excluir o favorito.")
      return
    }
    onDeleted(bookmark.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {bookmark ? "Editar favorito" : "Novo favorito"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bookmark-title">Título</Label>
            <Input
              id="bookmark-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookmark-url">URL</Label>
            <Input
              id="bookmark-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookmark-description">Descrição</Label>
            <Input
              id="bookmark-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookmark-category">Categoria</Label>
            <Input
              id="bookmark-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Documentação, Ferramentas..."
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          {bookmark ? (
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
                  <AlertDialogTitle>Excluir favorito?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O favorito &quot;{bookmark.title}&quot; será removido.
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
