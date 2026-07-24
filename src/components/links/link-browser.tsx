"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ExternalLink,
  Folder as FolderIcon,
  FolderPlus,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react"
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
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/layout/page-header"
import { createClient } from "@/lib/supabase/client"
import { sourceForUrl } from "@/lib/link-source"
import { cn } from "@/lib/utils"
import type { Folder, LinkItem } from "@/lib/types"
import { LinkDialog } from "./link-dialog"

type Props = {
  folderId: string | null
  breadcrumb: Folder[]
  initialFolders: Folder[]
  initialLinks: LinkItem[]
  openNew?: boolean
}

export function LinkBrowser({
  folderId,
  breadcrumb,
  initialFolders,
  initialLinks,
  openNew,
}: Props) {
  const router = useRouter()
  const [folders, setFolders] = useState<Folder[]>(initialFolders)
  const [links, setLinks] = useState<LinkItem[]>(initialLinks)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(Boolean(openNew))
  const [editing, setEditing] = useState<LinkItem | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(
    null
  )
  const [deleting, setDeleting] = useState<
    { type: "pasta" | "link"; id: string; name: string } | null
  >(null)

  useEffect(() => {
    setFolders(initialFolders)
    setLinks(initialLinks)
  }, [initialFolders, initialLinks])

  const filteredFolders = useMemo(() => {
    const term = search.toLowerCase()
    return term
      ? folders.filter((f) => f.name.toLowerCase().includes(term))
      : folders
  }, [folders, search])

  const filteredLinks = useMemo(() => {
    const term = search.toLowerCase()
    return term
      ? links.filter(
          (l) =>
            l.title.toLowerCase().includes(term) ||
            l.url.toLowerCase().includes(term) ||
            l.description.toLowerCase().includes(term)
        )
      : links
  }, [links, search])

  async function createFolder() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("folders")
      .insert({ name: "Nova pasta", parent_id: folderId })
      .select()
      .single()
    if (error || !data) {
      toast.error("Erro ao criar a pasta.")
      return
    }
    setFolders((prev) =>
      [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
    )
    setRenaming({ id: data.id, name: data.name })
  }

  async function handleRename() {
    if (!renaming || !renaming.name.trim()) return
    const supabase = createClient()
    const name = renaming.name.trim()
    const { error } = await supabase
      .from("folders")
      .update({ name })
      .eq("id", renaming.id)
    if (error) {
      toast.error("Erro ao renomear a pasta.")
      return
    }
    setFolders((prev) =>
      prev
        .map((f) => (f.id === renaming.id ? { ...f, name } : f))
        .sort((a, b) => a.name.localeCompare(b.name))
    )
    setRenaming(null)
  }

  async function toggleFavorite(link: LinkItem) {
    const next = !link.is_favorite
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, is_favorite: next } : l))
    )
    const supabase = createClient()
    const { error } = await supabase
      .from("links")
      .update({ is_favorite: next })
      .eq("id", link.id)
    if (error) toast.error("Erro ao atualizar o favorito.")
  }

  async function handleDelete() {
    if (!deleting) return
    const supabase = createClient()

    if (deleting.type === "link") {
      const { error } = await supabase
        .from("links")
        .delete()
        .eq("id", deleting.id)
      if (error) {
        toast.error("Erro ao excluir o link.")
        return
      }
      setLinks((prev) => prev.filter((l) => l.id !== deleting.id))
    } else {
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", deleting.id)
      if (error) {
        toast.error("Erro ao excluir a pasta.")
        return
      }
      setFolders((prev) => prev.filter((f) => f.id !== deleting.id))
      router.refresh()
    }
    setDeleting(null)
  }

  function handleSaved(saved: LinkItem, isNew: boolean) {
    setLinks((prev) =>
      isNew
        ? [...prev, saved].sort((a, b) => a.title.localeCompare(b.title))
        : prev.map((l) => (l.id === saved.id ? saved : l))
    )
  }

  const total = folders.length + links.length

  return (
    <div>
      <PageHeader
        title="Links"
        meta={`${total} ${total === 1 ? "item" : "itens"}`}
      >
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={createFolder}
        >
          <FolderPlus className="size-4" />
          Nova pasta
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="size-4" />
          Novo link
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {breadcrumb.length === 0 ? (
                <BreadcrumbPage>Raiz</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href="/links" />}>
                  Raiz
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {breadcrumb.map((folder, index) => (
              <BreadcrumbItem key={folder.id}>
                <BreadcrumbSeparator />
                {index === breadcrumb.length - 1 ? (
                  <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={`/links?pasta=${folder.id}`} />}
                  >
                    {folder.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar nesta pasta..."
            className="pl-8"
          />
        </div>
      </div>

      {filteredFolders.length === 0 && filteredLinks.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {search
              ? "Nada encontrado nesta pasta."
              : "Pasta vazia. Guarde aqui o link do Drive, um tutorial ou uma base de conhecimento."}
          </p>
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border">
          {filteredFolders.map((folder) => (
            <div
              key={folder.id}
              className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <FolderIcon className="size-4 shrink-0 fill-muted-foreground/20 text-muted-foreground" />
              <button
                className="flex-1 cursor-pointer truncate text-left text-sm font-medium"
                onClick={() => router.push(`/links?pasta=${folder.id}`)}
              >
                {folder.name}
              </button>
              <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Renomear"
                  onClick={() =>
                    setRenaming({ id: folder.id, name: folder.name })
                  }
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Excluir"
                  onClick={() =>
                    setDeleting({
                      type: "pasta",
                      id: folder.id,
                      name: folder.name,
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {filteredLinks.map((link) => {
            const source = sourceForUrl(link.url)
            return (
              <div
                key={link.id}
                className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40"
              >
                <source.icon className="size-4 shrink-0 text-muted-foreground" />
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 flex-1 items-baseline gap-2"
                >
                  <span className="truncate text-sm">{link.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {link.description || source.label}
                  </span>
                </a>
                <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:block">
                  {source.label}
                </span>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Favoritar"
                    onClick={() => toggleFavorite(link)}
                  >
                    <Star
                      className={cn(
                        "size-3.5",
                        link.is_favorite
                          ? "fill-amber-400 text-amber-400"
                          : "opacity-0 transition-opacity group-hover:opacity-100"
                      )}
                    />
                  </Button>
                  <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Abrir em nova aba"
                      render={
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      <ExternalLink className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Editar"
                      onClick={() => {
                        setEditing(link)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Excluir"
                      onClick={() =>
                        setDeleting({
                          type: "link",
                          id: link.id,
                          name: link.title,
                        })
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <LinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        link={editing}
        folderId={folderId}
        onSaved={handleSaved}
      />

      <Dialog
        open={Boolean(renaming)}
        onOpenChange={(o) => !o && setRenaming(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear pasta</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleRename()
            }}
            className="space-y-4"
          >
            <Input
              value={renaming?.name ?? ""}
              onChange={(e) =>
                setRenaming((r) => (r ? { ...r, name: e.target.value } : r))
              }
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenaming(null)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {deleting?.type === "pasta" ? "pasta" : "link"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleting?.name}&quot; será removido
              {deleting?.type === "pasta"
                ? "; os links dentro dela voltam para a raiz"
                : ""}
              . O conteúdo no destino não é afetado.
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
  )
}
