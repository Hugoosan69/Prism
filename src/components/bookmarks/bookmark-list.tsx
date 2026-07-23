"use client"

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react"
import { Pencil, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Bookmark } from "@/lib/types"
import { BookmarkDialog } from "./bookmark-dialog"

type Props = {
  initialBookmarks: Bookmark[]
  openNew?: boolean
}

function faviconUrl(url: string) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return null
  }
}

export function BookmarkList({ initialBookmarks, openNew }: Props) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(Boolean(openNew))
  const [editing, setEditing] = useState<Bookmark | null>(null)

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    if (!term) return bookmarks
    return bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(term) ||
        b.url.toLowerCase().includes(term) ||
        b.description.toLowerCase().includes(term) ||
        b.category.toLowerCase().includes(term)
    )
  }, [bookmarks, search])

  const grouped = useMemo(() => {
    const map = new Map<string, Bookmark[]>()
    for (const bookmark of filtered) {
      const key = bookmark.category || "Sem categoria"
      map.set(key, [...(map.get(key) ?? []), bookmark])
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  function handleSaved(saved: Bookmark, isNew: boolean) {
    setBookmarks((prev) =>
      isNew ? [...prev, saved] : prev.map((b) => (b.id === saved.id ? saved : b))
    )
  }

  function handleDeleted(id: string) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Favoritos</h1>
        <Button
          size="sm"
          className="gap-1"
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="size-4" />
          Novo favorito
        </Button>
      </div>

      <div className="relative w-full max-w-xs">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar favoritos..."
          className="pl-8"
        />
      </div>

      {grouped.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {bookmarks.length === 0
            ? "Nenhum favorito ainda. Adicione o primeiro."
            : "Nada encontrado."}
        </p>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {category}
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((bookmark) => {
                  const favicon = faviconUrl(bookmark.url)
                  return (
                    <div
                      key={bookmark.id}
                      className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/30"
                    >
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        {favicon ? (
                          <img
                            src={favicon}
                            alt=""
                            width={20}
                            height={20}
                            className="shrink-0 rounded"
                          />
                        ) : (
                          <div className="size-5 shrink-0 rounded bg-muted" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {bookmark.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {bookmark.description || bookmark.url}
                          </p>
                        </div>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => {
                          setEditing(bookmark)
                          setDialogOpen(true)
                        }}
                        title="Editar"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <BookmarkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bookmark={editing}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
