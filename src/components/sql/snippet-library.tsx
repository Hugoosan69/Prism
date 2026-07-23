"use client"

import { useMemo, useState } from "react"
import { Check, Copy, Pencil, Plus, Search, Star } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Snippet } from "@/lib/types"
import { CodeBlock } from "./code-block"
import { SnippetDialog } from "./snippet-dialog"

type Props = {
  initialSnippets: Snippet[]
  openNew?: boolean
  openSnippetId?: string
}

export function SnippetLibrary({
  initialSnippets,
  openNew,
  openSnippetId,
}: Props) {
  const [snippets, setSnippets] = useState<Snippet[]>(initialSnippets)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(
    Boolean(openNew) || Boolean(openSnippetId)
  )
  const [editing, setEditing] = useState<Snippet | null>(
    openSnippetId
      ? (initialSnippets.find((s) => s.id === openSnippetId) ?? null)
      : null
  )

  const categories = useMemo(
    () =>
      [...new Set(snippets.map((s) => s.category).filter(Boolean))].sort(),
    [snippets]
  )

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return snippets.filter((s) => {
      if (onlyFavorites && !s.is_favorite) return false
      if (category && s.category !== category) return false
      if (!term) return true
      return (
        s.title.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        s.tags.some((t) => t.toLowerCase().includes(term))
      )
    })
  }, [snippets, search, category, onlyFavorites])

  async function handleCopy(snippet: Snippet) {
    await navigator.clipboard.writeText(snippet.code)
    setCopiedId(snippet.id)
    setTimeout(() => setCopiedId(null), 1500)

    const lastUsed = new Date().toISOString()
    setSnippets((prev) =>
      prev.map((s) =>
        s.id === snippet.id ? { ...s, last_used_at: lastUsed } : s
      )
    )
    const supabase = createClient()
    await supabase
      .from("snippets")
      .update({ last_used_at: lastUsed })
      .eq("id", snippet.id)
  }

  async function toggleFavorite(snippet: Snippet) {
    const supabase = createClient()
    const next = !snippet.is_favorite
    setSnippets((prev) =>
      prev.map((s) => (s.id === snippet.id ? { ...s, is_favorite: next } : s))
    )
    const { error } = await supabase
      .from("snippets")
      .update({ is_favorite: next })
      .eq("id", snippet.id)
    if (error) toast.error("Erro ao atualizar o favorito.")
  }

  function openEdit(snippet: Snippet) {
    setEditing(snippet)
    setDialogOpen(true)
  }

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function handleSaved(saved: Snippet, isNew: boolean) {
    setSnippets((prev) =>
      isNew ? [saved, ...prev] : prev.map((s) => (s.id === saved.id ? saved : s))
    )
  }

  function handleDeleted(id: string) {
    setSnippets((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Biblioteca SQL</h1>
        <Button size="sm" onClick={openCreate} className="gap-1">
          <Plus className="size-4" />
          Nova consulta
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar consultas..."
            className="pl-8"
          />
        </div>
        <Button
          variant={onlyFavorites ? "secondary" : "ghost"}
          size="sm"
          className="gap-1"
          onClick={() => setOnlyFavorites((v) => !v)}
        >
          <Star
            className={cn(
              "size-4",
              onlyFavorites && "fill-amber-400 text-amber-400"
            )}
          />
          Favoritos
        </Button>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categories.map((c) => (
              <Badge
                key={c}
                variant={category === c ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCategory(category === c ? null : c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {snippets.length === 0
            ? "Nenhuma consulta salva ainda. Crie a primeira."
            : "Nada encontrado com esses filtros."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((snippet) => (
            <div
              key={snippet.id}
              className="space-y-2 rounded-lg border bg-card p-4"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{snippet.title}</span>
                    {snippet.category && (
                      <Badge variant="secondary">{snippet.category}</Badge>
                    )}
                    {snippet.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {snippet.description && (
                    <p className="text-sm text-muted-foreground">
                      {snippet.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toggleFavorite(snippet)}
                  title="Favoritar"
                >
                  <Star
                    className={cn(
                      "size-4",
                      snippet.is_favorite && "fill-amber-400 text-amber-400"
                    )}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(snippet)}
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleCopy(snippet)}
                  title="Copiar SQL"
                >
                  {copiedId === snippet.id ? (
                    <Check className="size-4 text-green-500" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <CodeBlock code={snippet.code} />
            </div>
          ))}
        </div>
      )}

      <SnippetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        snippet={editing}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
