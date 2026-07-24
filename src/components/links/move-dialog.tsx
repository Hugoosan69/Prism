"use client"

import { useMemo, useState } from "react"
import { Check, ChevronRight, Folder as FolderIcon, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Folder } from "@/lib/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** O que está sendo movido, para nomear na descrição */
  itemName: string
  currentFolderId: string | null
  folders: Folder[]
  /** Pasta que não pode receber (ela mesma), ao mover uma pasta */
  excludeFolderId?: string
  onMove: (folderId: string | null) => Promise<void>
}

type Node = { folder: Folder; depth: number }

/** Achata a árvore de pastas preservando a hierarquia visual */
function flatten(
  folders: Folder[],
  parentId: string | null,
  depth: number,
  blocked: Set<string>
): Node[] {
  return folders
    .filter((f) => f.parent_id === parentId && !blocked.has(f.id))
    .flatMap((folder) => [
      { folder, depth },
      ...flatten(folders, folder.id, depth + 1, blocked),
    ])
}

/** Uma pasta não pode ser movida para dentro de si mesma */
function descendantsOf(folders: Folder[], id: string): string[] {
  const children = folders.filter((f) => f.parent_id === id)
  return children.flatMap((c) => [c.id, ...descendantsOf(folders, c.id)])
}

export function MoveDialog({
  open,
  onOpenChange,
  itemName,
  currentFolderId,
  folders,
  excludeFolderId,
  onMove,
}: Props) {
  const [moving, setMoving] = useState(false)

  const tree = useMemo(() => {
    const blocked = new Set<string>()
    if (excludeFolderId) {
      blocked.add(excludeFolderId)
      descendantsOf(folders, excludeFolderId).forEach((id) => blocked.add(id))
    }
    return flatten(folders, null, 0, blocked)
  }, [folders, excludeFolderId])

  async function choose(folderId: string | null) {
    if (folderId === currentFolderId) {
      onOpenChange(false)
      return
    }
    setMoving(true)
    await onMove(folderId)
    setMoving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80svh] flex-col sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Mover</DialogTitle>
          <DialogDescription>
            Escolha o destino de &quot;{itemName}&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="-mr-1 flex-1 space-y-0.5 overflow-y-auto pr-1">
          <button
            type="button"
            disabled={moving}
            onClick={() => choose(null)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50",
              currentFolderId === null && "bg-muted/60"
            )}
          >
            <Home className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1">Raiz</span>
            {currentFolderId === null && (
              <Check className="size-3.5 text-muted-foreground" />
            )}
          </button>

          {tree.map(({ folder, depth }) => (
            <button
              key={folder.id}
              type="button"
              disabled={moving}
              onClick={() => choose(folder.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50",
                currentFolderId === folder.id && "bg-muted/60"
              )}
              style={{ paddingLeft: `${depth * 16 + 10}px` }}
            >
              {depth > 0 && (
                <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" />
              )}
              <FolderIcon
                className="size-4 shrink-0"
                style={{ color: "var(--spec-arquivos)" }}
              />
              <span className="flex-1 truncate">{folder.name}</span>
              {currentFolderId === folder.id && (
                <Check className="size-3.5 text-muted-foreground" />
              )}
            </button>
          ))}

          {tree.length === 0 && (
            <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
              Nenhuma pasta criada ainda.
            </p>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
