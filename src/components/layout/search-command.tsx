"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bookmark,
  Database,
  File,
  SquareKanban,
  StickyNote,
} from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { createClient } from "@/lib/supabase/client"

type Result = {
  id: string
  label: string
  hint: string
  group: string
  action: () => void
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  const search = useCallback(
    async (term: string) => {
      if (term.length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      const supabase = createClient()
      const like = `%${term}%`

      const [tasks, snippets, notes, files, bookmarks] = await Promise.all([
        supabase
          .from("tasks")
          .select("id, title, status")
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(5),
        supabase
          .from("snippets")
          .select("id, title, category")
          .or(`title.ilike.${like},description.ilike.${like},code.ilike.${like}`)
          .limit(5),
        supabase
          .from("notes")
          .select("id, title")
          .or(`title.ilike.${like},content.ilike.${like}`)
          .limit(5),
        supabase
          .from("files")
          .select("id, name, folder_id")
          .ilike("name", like)
          .limit(5),
        supabase
          .from("bookmarks")
          .select("id, title, url")
          .or(`title.ilike.${like},url.ilike.${like},description.ilike.${like}`)
          .limit(5),
      ])

      const found: Result[] = [
        ...(tasks.data ?? []).map((t) => ({
          id: `task-${t.id}`,
          label: t.title,
          hint: "Tarefa",
          group: "Tarefas",
          action: () => router.push(`/kanban?task=${t.id}`),
        })),
        ...(snippets.data ?? []).map((s) => ({
          id: `snippet-${s.id}`,
          label: s.title,
          hint: s.category || "SQL",
          group: "SQL",
          action: () => router.push(`/sql?snippet=${s.id}`),
        })),
        ...(notes.data ?? []).map((n) => ({
          id: `note-${n.id}`,
          label: n.title || "Sem título",
          hint: "Nota",
          group: "Notas",
          action: () => router.push(`/notas/${n.id}`),
        })),
        ...(files.data ?? []).map((f) => ({
          id: `file-${f.id}`,
          label: f.name,
          hint: "Arquivo",
          group: "Arquivos",
          action: () =>
            router.push(
              f.folder_id ? `/arquivos?pasta=${f.folder_id}` : "/arquivos"
            ),
        })),
        ...(bookmarks.data ?? []).map((b) => ({
          id: `bookmark-${b.id}`,
          label: b.title,
          hint: b.url,
          group: "Favoritos",
          action: () => window.open(b.url, "_blank"),
        })),
      ]

      setResults(found)
      setLoading(false)
    },
    [router]
  )

  function handleQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 250)
  }

  function select(result: Result) {
    onOpenChange(false)
    setQuery("")
    setResults([])
    result.action()
  }

  const groups = [...new Set(results.map((r) => r.group))]
  const groupIcons: Record<string, React.ElementType> = {
    Tarefas: SquareKanban,
    SQL: Database,
    Notas: StickyNote,
    Arquivos: File,
    Favoritos: Bookmark,
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Pesquisa"
      description="Pesquisar em tudo"
    >
      <Command shouldFilter={false}>
      <CommandInput
        placeholder="Pesquisar tarefas, SQL, notas, arquivos, favoritos..."
        value={query}
        onValueChange={handleQueryChange}
      />
      <CommandList>
        <CommandEmpty>
          {loading
            ? "Pesquisando..."
            : query.length < 2
              ? "Digite ao menos 2 caracteres."
              : "Nada encontrado."}
        </CommandEmpty>
        {groups.map((group) => {
          const Icon = groupIcons[group]
          return (
            <CommandGroup key={group} heading={group}>
              {results
                .filter((r) => r.group === group)
                .map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => select(result)}
                  >
                    <Icon className="size-4" />
                    <span className="flex-1 truncate">{result.label}</span>
                    <span className="max-w-40 truncate text-xs text-muted-foreground">
                      {result.hint}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          )
        })}
      </CommandList>
      </Command>
    </CommandDialog>
  )
}
