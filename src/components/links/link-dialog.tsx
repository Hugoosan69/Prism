"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
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
import { sourceForUrl } from "@/lib/link-source"
import type { LinkItem } from "@/lib/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  link: LinkItem | null
  folderId: string | null
  onSaved: (link: LinkItem, isNew: boolean) => void
}

export function LinkDialog({
  open,
  onOpenChange,
  link,
  folderId,
  onSaved,
}: Props) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(link?.title ?? "")
    setUrl(link?.url ?? "")
    setDescription(link?.description ?? "")
  }, [open, link])

  const source = url.trim() ? sourceForUrl(normalize(url)) : null

  function normalize(value: string) {
    const trimmed = value.trim()
    return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
  }

  async function handleSave() {
    if (!title.trim() || !url.trim()) {
      toast.error("Informe título e endereço.")
      return
    }
    setSaving(true)
    const supabase = createClient()

    const payload = {
      title: title.trim(),
      url: normalize(url),
      description: description.trim(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = link
      ? await supabase
          .from("links")
          .update(payload)
          .eq("id", link.id)
          .select()
          .single()
      : await supabase
          .from("links")
          .insert({ ...payload, folder_id: folderId })
          .select()
          .single()

    setSaving(false)
    if (error || !data) {
      toast.error("Erro ao salvar o link.")
      return
    }
    onSaved(data, !link)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{link ? "Editar link" : "Novo link"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="link-title">Título</Label>
            <Input
              id="link-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contrato assinado, tutorial de deploy..."
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-url">Endereço</Label>
            <Input
              id="link-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
            {source && (
              <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <source.icon className="size-3" />
                {source.label}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-description">Descrição</Label>
            <Input
              id="link-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
