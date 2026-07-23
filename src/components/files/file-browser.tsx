"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Download,
  File,
  FileText,
  Folder as FolderIcon,
  FolderPlus,
  Image as ImageIcon,
  Loader2,
  Music,
  Pencil,
  Search,
  Trash2,
  Upload,
  Video,
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
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { cn, formatBytes } from "@/lib/utils"
import type { FileItem, Folder } from "@/lib/types"

type Props = {
  folderId: string | null
  breadcrumb: Folder[]
  initialFolders: Folder[]
  initialFiles: FileItem[]
  autoUpload?: boolean
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon
  if (mimeType.startsWith("video/")) return Video
  if (mimeType.startsWith("audio/")) return Music
  if (mimeType.includes("text") || mimeType.includes("pdf")) return FileText
  return File
}

export function FileBrowser({
  folderId,
  breadcrumb,
  initialFolders,
  initialFiles,
  autoUpload,
}: Props) {
  const router = useRouter()
  const [folders, setFolders] = useState<Folder[]>(initialFolders)
  const [files, setFiles] = useState<FileItem[]>(initialFiles)
  const [search, setSearch] = useState("")
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [renaming, setRenaming] = useState<
    { type: "folder" | "file"; id: string; name: string } | null
  >(null)
  const [deleting, setDeleting] = useState<
    { type: "folder" | "file"; id: string; name: string } | null
  >(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoUploadDone = useRef(false)

  useEffect(() => {
    setFolders(initialFolders)
    setFiles(initialFiles)
  }, [initialFolders, initialFiles])

  useEffect(() => {
    if (autoUpload && !autoUploadDone.current) {
      autoUploadDone.current = true
      fileInputRef.current?.click()
    }
  }, [autoUpload])

  const filteredFolders = useMemo(() => {
    const term = search.toLowerCase()
    return term
      ? folders.filter((f) => f.name.toLowerCase().includes(term))
      : folders
  }, [folders, search])

  const filteredFiles = useMemo(() => {
    const term = search.toLowerCase()
    return term
      ? files.filter((f) => f.name.toLowerCase().includes(term))
      : files
  }, [files, search])

  async function uploadFiles(fileList: FileList | File[]) {
    const items = [...fileList]
    if (items.length === 0) return
    setUploading(true)
    const supabase = createClient()

    for (const file of items) {
      const path = `arquivos/${folderId ?? "raiz"}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from("files")
        .upload(path, file)
      if (uploadError) {
        toast.error(`Erro ao enviar ${file.name}.`)
        continue
      }
      const { data, error } = await supabase
        .from("files")
        .insert({
          folder_id: folderId,
          name: file.name,
          storage_path: path,
          size: file.size,
          mime_type: file.type,
        })
        .select()
        .single()
      if (error || !data) {
        toast.error(`Erro ao registrar ${file.name}.`)
        continue
      }
      setFiles((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      )
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

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
    setRenaming({ type: "folder", id: data.id, name: data.name })
  }

  async function handleRename() {
    if (!renaming || !renaming.name.trim()) return
    const supabase = createClient()
    const name = renaming.name.trim()
    const { error } =
      renaming.type === "folder"
        ? await supabase.from("folders").update({ name }).eq("id", renaming.id)
        : await supabase.from("files").update({ name }).eq("id", renaming.id)
    if (error) {
      toast.error("Erro ao renomear.")
      return
    }
    if (renaming.type === "folder") {
      setFolders((prev) =>
        prev.map((f) => (f.id === renaming.id ? { ...f, name } : f))
      )
    } else {
      setFiles((prev) =>
        prev.map((f) => (f.id === renaming.id ? { ...f, name } : f))
      )
    }
    setRenaming(null)
  }

  async function handleDelete() {
    if (!deleting) return
    const supabase = createClient()

    if (deleting.type === "file") {
      const file = files.find((f) => f.id === deleting.id)
      if (file) {
        await supabase.storage.from("files").remove([file.storage_path])
      }
      const { error } = await supabase
        .from("files")
        .delete()
        .eq("id", deleting.id)
      if (error) {
        toast.error("Erro ao excluir o arquivo.")
        return
      }
      setFiles((prev) => prev.filter((f) => f.id !== deleting.id))
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
  }

  async function handleDownload(file: FileItem) {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from("files")
      .createSignedUrl(file.storage_path, 60)
    if (error || !data) {
      toast.error("Erro ao gerar o link.")
      return
    }
    window.open(data.signedUrl, "_blank")
  }

  return (
    <div
      className={cn(
        "space-y-4 rounded-lg transition-colors",
        dragOver && "bg-muted/40 outline-2 outline-dashed outline-primary/40"
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        uploadFiles(e.dataTransfer.files)
      }}
    >
      <PageHeader
        title="Arquivos"
        meta={`${folders.length + files.length} ${folders.length + files.length === 1 ? "item" : "itens"}`}
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
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Enviar
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {breadcrumb.length === 0 ? (
                <BreadcrumbPage>Raiz</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href="/arquivos" />}>
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
                    render={<Link href={`/arquivos?pasta=${folder.id}`} />}
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

      {filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Pasta vazia. Envie arquivos ou arraste-os para cá.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {filteredFolders.map((folder) => (
            <div
              key={folder.id}
              className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/40"
            >
              <FolderIcon className="size-4 shrink-0 fill-muted-foreground/20 text-muted-foreground" />
              <button
                className="flex-1 cursor-pointer truncate text-left text-sm font-medium"
                onClick={() => router.push(`/arquivos?pasta=${folder.id}`)}
              >
                {folder.name}
              </button>
              <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Renomear"
                  onClick={() =>
                    setRenaming({
                      type: "folder",
                      id: folder.id,
                      name: folder.name,
                    })
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
                      type: "folder",
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
          {filteredFiles.map((file) => {
            const Icon = fileIcon(file.mime_type)
            return (
              <div
                key={file.id}
                className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/40"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <button
                  className="flex-1 cursor-pointer truncate text-left text-sm"
                  onClick={() => handleDownload(file)}
                  title="Abrir / baixar"
                >
                  {file.name}
                </button>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
                <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
                  {format(new Date(file.created_at), "dd/MM/yyyy")}
                </span>
                <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Baixar"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Renomear"
                    onClick={() =>
                      setRenaming({ type: "file", id: file.id, name: file.name })
                    }
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Excluir"
                    onClick={() =>
                      setDeleting({ type: "file", id: file.id, name: file.name })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={Boolean(renaming)} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear</DialogTitle>
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
              Excluir {deleting?.type === "folder" ? "pasta" : "arquivo"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleting?.name}&quot; será removido
              {deleting?.type === "folder"
                ? " junto com as subpastas (os arquivos dentro dela ficam na raiz)"
                : ""}
              . Essa ação não pode ser desfeita.
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
