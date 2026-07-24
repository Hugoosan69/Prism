"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Columns2, Eye, Pencil, Star, Trash2 } from "lucide-react"
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
import { applyFormat, continueList } from "@/lib/markdown-format"
import { cn } from "@/lib/utils"
import type { Note } from "@/lib/types"
import { EditorToolbar, type Format } from "./editor-toolbar"
import { MarkdownPreview } from "./markdown-preview"

type View = "editar" | "dividido" | "ler"

const VIEWS: { value: View; label: string; icon: typeof Pencil }[] = [
  { value: "editar", label: "Escrever", icon: Pencil },
  { value: "dividido", label: "Escrever e ver", icon: Columns2 },
  { value: "ler", label: "Ler", icon: Eye },
]

export function NoteEditor({ note }: { note: Note }) {
  const router = useRouter()
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [favorite, setFavorite] = useState(note.is_favorite)
  const [view, setView] = useState<View>("dividido")
  const [saveState, setSaveState] = useState<"saved" | "saving" | "pending">(
    "saved"
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scheduleSave = useCallback(
    (nextTitle: string, nextContent: string) => {
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
    },
    [note.id]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  /** Aplica a marcação e devolve o cursor para onde o texto continua */
  function handleFormat(format: Format) {
    const textarea = textareaRef.current
    if (!textarea) return

    const result = applyFormat(
      content,
      textarea.selectionStart,
      textarea.selectionEnd,
      format
    )
    setContent(result.text)
    scheduleSave(title, result.text)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const mod = e.ctrlKey || e.metaKey

    if (mod && !e.shiftKey) {
      const shortcuts: Record<string, Format> = {
        b: "bold",
        i: "italic",
        k: "link",
      }
      const format = shortcuts[e.key.toLowerCase()]
      if (format) {
        e.preventDefault()
        handleFormat(format)
        return
      }
    }

    // Enter continua a lista onde o cursor está
    if (e.key === "Enter" && !e.shiftKey) {
      const textarea = e.currentTarget
      if (textarea.selectionStart !== textarea.selectionEnd) return
      const result = continueList(content, textarea.selectionStart)
      if (!result) return
      e.preventDefault()
      setContent(result.text)
      scheduleSave(title, result.text)
      requestAnimationFrame(() => {
        textarea.setSelectionRange(result.selectionStart, result.selectionEnd)
      })
    }
  }

  async function toggleFavorite() {
    const next = !favorite
    setFavorite(next)
    const supabase = createClient()
    await supabase.from("notes").update({ is_favorite: next }).eq("id", note.id)
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

  const editor = (
    <Textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => {
        setContent(e.target.value)
        scheduleSave(title, e.target.value)
      }}
      onKeyDown={handleKeyDown}
      placeholder="Escreva aqui. Use a barra acima para formatar, ou Ctrl+B e Ctrl+I direto no texto."
      className="field-sizing-fixed h-full min-h-0 resize-none overflow-auto font-mono text-sm leading-relaxed"
      spellCheck={false}
    />
  )

  const preview = (
    <div className="h-full overflow-auto rounded-lg border bg-card p-5">
      <MarkdownPreview content={content} />
    </div>
  )

  return (
    <div className="mx-auto flex h-[calc(100svh-8.5rem)] max-w-5xl flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/notas")}
          title="Voltar para as notas"
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
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
        />
        <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
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
            className={cn("size-4", favorite && "fill-amber-400 text-amber-400")}
          />
        </Button>

        {/* Escrever · Escrever e ver · Ler */}
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
          {VIEWS.map((item) => (
            <Button
              key={item.value}
              variant="ghost"
              size="icon-sm"
              title={item.label}
              aria-label={item.label}
              aria-pressed={view === item.value}
              onClick={() => setView(item.value)}
              className={cn(
                "size-7",
                view === item.value && "bg-background shadow-xs"
              )}
            >
              <item.icon className="size-3.5" />
            </Button>
          ))}
        </div>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                title="Excluir nota"
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

      {view !== "ler" && <EditorToolbar onFormat={handleFormat} />}

      {view === "dividido" ? (
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
          {editor}
          <div className="hidden min-h-0 lg:block">{preview}</div>
        </div>
      ) : view === "editar" ? (
        <div className="min-h-0 flex-1">{editor}</div>
      ) : (
        <div className="min-h-0 flex-1">{preview}</div>
      )}
    </div>
  )
}
