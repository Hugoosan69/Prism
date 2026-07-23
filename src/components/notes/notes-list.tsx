"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Plus, Search, Star } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type NoteSummary = {
  id: string
  title: string
  content: string
  is_favorite: boolean
  updated_at: string
  created_at: string
}

export function NotesList({ notes }: { notes: NoteSummary[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    if (!term) return notes
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(term) ||
        n.content.toLowerCase().includes(term)
    )
  }, [notes, search])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notas"
        meta={`${notes.length} ${notes.length === 1 ? "nota" : "notas"}`}
      >
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => router.push("/notas?new=1")}
        >
          <Plus className="size-4" />
          Nova nota
        </Button>
      </PageHeader>

      <div className="relative w-full max-w-xs">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar notas..."
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {notes.length === 0
            ? "Nenhuma nota ainda. Crie a primeira."
            : "Nada encontrado."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <Link
              key={note.id}
              href={`/notas/${note.id}`}
              className="group space-y-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate font-medium">
                  {note.title || "Sem título"}
                </span>
                {note.is_favorite && (
                  <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                )}
              </div>
              <p className="line-clamp-3 text-sm whitespace-pre-line text-muted-foreground">
                {note.content || "Nota vazia"}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground/70">
                {formatDistanceToNow(new Date(note.updated_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
