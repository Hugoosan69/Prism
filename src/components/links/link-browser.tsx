"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ExternalLink,
  Folder as FolderIcon,
  FolderInput,
  FolderPlus,
  MoreHorizontal,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/layout/page-header"
import { createClient } from "@/lib/supabase/client"
import { sourceForUrl } from "@/lib/link-source"
import { cn } from "@/lib/utils"
import type { Folder, LinkItem } from "@/lib/types"
import { LinkDialog } from "./link-dialog"
import { MoveDialog } from "./move-dialog"

type Props = {
  folderId: string | null
  breadcrumb: Folder[]
  initialFolders: Folder[]
  initialLinks: LinkItem[]
  allFolders: Folder[]
  folderCounts: Record<string, number>
  openNew?: boolean
}

type Moving =
  | { kind: "link"; item: LinkItem }
  | { kind: "folder"; item: Folder }

export function LinkBrowser({
  folderId,
  breadcrumb,
  initialFolders,
  initialLinks,
  allFolders,
  folderCounts,
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
  const [moving, setMoving] = useState<Moving | null>(null)
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
    router.refresh()
  }

  async function handleMove(destinoId: string | null) {
    if (!moving) return
    const supabase = createClient()

    if (moving.kind === "link") {
      const { error } = await supabase
        .from("links")
        .update({ folder_id: destinoId })
        .eq("id", moving.item.id)
      if (error) {
        toast.error("Erro ao mover o link.")
        return
      }
      setLinks((prev) => prev.filter((l) => l.id !== moving.item.id))
      toast.success(`"${moving.item.title}" movido.`)
    } else {
      const { error } = await supabase
        .from("folders")
        .update({ parent_id: destinoId })
        .eq("id", moving.item.id)
      if (error) {
        toast.error("Erro ao mover a pasta.")
        return
      }
      setFolders((prev) => prev.filter((f) => f.id !== moving.item.id))
      toast.success(`"${moving.item.name}" movida.`)
    }
    router.refresh()
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
    }
    setDeleting(null)
    router.refresh()
  }

  function handleSaved(saved: LinkItem, isNew: boolean) {
    setLinks((prev) =>
      isNew
        ? [...prev, saved].sort((a, b) => a.title.localeCompare(b.title))
        : prev.map((l) => (l.id === saved.id ? saved : l))
    )
  }

  const total = folders.length + links.length
  const vazio = filteredFolders.length === 0 && filteredLinks.length === 0

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

      <div className="mb-6 flex flex-wrap items-center gap-3">
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

      {vazio ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {search
              ? "Nada encontrado nesta pasta."
              : "Pasta vazia. Guarde aqui o link do Drive, um tutorial ou uma base de conhecimento."}
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          {/* Pastas: cartões, para separar do que é conteúdo final */}
          {filteredFolders.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                Pastas
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFolders.map((folder) => {
                  const count = folderCounts[folder.id] ?? 0
                  return (
                    <div
                      key={folder.id}
                      className="group relative flex items-center gap-3 rounded-xl border bg-card p-3.5 transition-colors hover:border-foreground/20"
                    >
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background:
                            "color-mix(in oklch, var(--spec-arquivos) 14%, transparent)",
                        }}
                      >
                        <FolderIcon
                          className="size-4.5"
                          style={{ color: "var(--spec-arquivos)" }}
                        />
                      </div>
                      <button
                        onClick={() => router.push(`/links?pasta=${folder.id}`)}
                        className="min-w-0 flex-1 text-left"
                      >
                        {/* Área clicável cobre o cartão inteiro */}
                        <span className="absolute inset-0 rounded-xl" />
                        <span className="block truncate text-sm font-medium">
                          {folder.name}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {count} {count === 1 ? "item" : "itens"}
                        </span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Ações da pasta"
                              className="relative opacity-0 transition-opacity group-hover:opacity-100 data-[popup-open]:opacity-100"
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setRenaming({
                                id: folder.id,
                                name: folder.name,
                              })
                            }
                          >
                            <Pencil className="size-4" />
                            Renomear
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setMoving({ kind: "folder", item: folder })
                            }
                          >
                            <FolderInput className="size-4" />
                            Mover para...
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              setDeleting({
                                type: "pasta",
                                id: folder.id,
                                name: folder.name,
                              })
                            }
                          >
                            <Trash2 className="size-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Links: lista com respiro, origem à direita */}
          {filteredLinks.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                Links
              </h2>
              <div className="overflow-hidden rounded-xl border divide-y">
                {filteredLinks.map((link) => {
                  const source = sourceForUrl(link.url)
                  return (
                    <div
                      key={link.id}
                      className="group relative flex items-center gap-3 bg-card p-3.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/70">
                        <source.icon className="size-4.5 text-muted-foreground" />
                      </div>

                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1"
                      >
                        <span className="absolute inset-0" />
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">
                            {link.title}
                          </span>
                          {link.is_favorite && (
                            <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {link.description || link.url}
                        </span>
                      </a>

                      <span className="relative hidden shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
                        {source.label}
                      </span>

                      <div className="relative flex items-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={
                            link.is_favorite
                              ? "Remover dos favoritos"
                              : "Favoritar"
                          }
                          onClick={() => toggleFavorite(link)}
                          className={cn(
                            "transition-opacity",
                            !link.is_favorite &&
                              "opacity-0 group-hover:opacity-100"
                          )}
                        >
                          <Star
                            className={cn(
                              "size-3.5",
                              link.is_favorite &&
                                "fill-amber-400 text-amber-400"
                            )}
                          />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Ações do link"
                                className="opacity-0 transition-opacity group-hover:opacity-100 data-[popup-open]:opacity-100"
                              />
                            }
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => window.open(link.url, "_blank")}
                            >
                              <ExternalLink className="size-4" />
                              Abrir
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(link)
                                setDialogOpen(true)
                              }}
                            >
                              <Pencil className="size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setMoving({ kind: "link", item: link })
                              }
                            >
                              <FolderInput className="size-4" />
                              Mover para...
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setDeleting({
                                  type: "link",
                                  id: link.id,
                                  name: link.title,
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      <LinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        link={editing}
        folderId={folderId}
        onSaved={handleSaved}
      />

      <MoveDialog
        open={Boolean(moving)}
        onOpenChange={(o) => !o && setMoving(null)}
        itemName={
          moving?.kind === "link"
            ? moving.item.title
            : (moving?.item.name ?? "")
        }
        currentFolderId={folderId}
        folders={allFolders}
        excludeFolderId={
          moving?.kind === "folder" ? moving.item.id : undefined
        }
        onMove={handleMove}
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
