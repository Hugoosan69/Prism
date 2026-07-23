"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, Pencil, Star, Trash2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Note } from "@/lib/types"
import { MarkdownPreview } from "./markdown-preview"

export function NoteEditor({ note }: { note: Note }) {
  const router = useRouter()
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [favorite, setFavorite] = useState(note.is_favorite)
  const [preview, setPreview] = useState(false)
  const [saveState, setSaveState] = useState<"saved" | "saving" | "pending">(
    "saved"
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleSave(nextTitle: string, nextContent: string) {
    setSaveState("pending")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaveState("saving")
      const supabase = createClient()
      const { error } = await supabase
        .from("notes")
        .update({
          title: nextTitle,
          content: nextContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", note.id)
      if (error) {
        toast.error("Erro ao salvar a nota.")
        setSaveState("pending")
        return
      }
      setSaveState("saved")
    }, 800)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  async function toggleFavorite() {
    const next = !favorite
    setFavorite(next)
    const supabase = createClient()
    await supabase
      .from("notes")
      .update({ is_favorite: next })
      .eq("id", note.id)
  }

  async function handleDelete() {
    const supabase = createClient()
    const { error } = await supabase.from("notes").delete().eq("id", note.id)
    if (error) {
      toast.error("Erro ao excluir a nota.")
      return
    }
    router.push("/notas")
    router.refresh()
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/notas")}
          title="Voltar"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            scheduleSave(e.target.value, content)
          }}
          placeholder="Título da nota"
          className="flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground/50"
        />
        <span className="text-xs text-muted-foreground">
          {saveState === "saved"
            ? "Salvo"
            : saveState === "saving"
              ? "Salvando..."
              : "Alterações pendentes"}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleFavorite}
          title="Favoritar"
        >
          <Star
            className={cn(
              "size-4",
              favorite && "fill-amber-400 text-amber-400"
            )}
          />
        </Button>
        <Button
          variant={preview ? "secondary" : "ghost"}
          size="sm"
          className="gap-1"
          onClick={() => setPreview((v) => !v)}
        >
          {preview ? (
            <>
              <Pencil className="size-4" />
              Editar
            </>
          ) : (
            <>
              <Eye className="size-4" />
              Visualizar
            </>
          )}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                title="Excluir"
              />
            }
          >
            <Trash2 className="size-4" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir nota?</AlertDialogTitle>
              <AlertDialogDescription>
                A nota &quot;{title || "Sem título"}&quot; será removida. Essa
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
      </div>

      {preview ? (
        <div className="flex-1 overflow-auto rounded-lg border bg-card p-6">
          <MarkdownPreview content={content} />
        </div>
      ) : (
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            scheduleSave(title, e.target.value)
          }}
          placeholder="Escreva em Markdown... use - [ ] para checklists e ``` para código."
          className="flex-1 resize-none font-mono text-sm leading-relaxed"
          spellCheck={false}
        />
      )}
    </div>
  )
}
