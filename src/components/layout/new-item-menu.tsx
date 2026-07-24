"use client"

import { useRouter } from "next/navigation"
import {
  Bookmark,
  Database,
  Link2,
  Plus,
  SquareKanban,
  StickyNote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const options = [
  { label: "Tarefa", href: "/kanban?new=1", icon: SquareKanban },
  { label: "Consulta SQL", href: "/sql?new=1", icon: Database },
  { label: "Nota", href: "/notas?new=1", icon: StickyNote },
  { label: "Favorito", href: "/favoritos?new=1", icon: Bookmark },
  { label: "Link", href: "/links?new=1", icon: Link2 },
]

export function NewItemMenu() {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" className="gap-1" />}>
        <Plus className="size-4" />
        Novo
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.href}
            onClick={() => router.push(option.href)}
          >
            <option.icon className="size-4" />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
