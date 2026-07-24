"use client"

import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Strikethrough,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export type Format =
  | "h1"
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "link"
  | "bullet"
  | "ordered"
  | "checklist"
  | "quote"

type Props = {
  onFormat: (format: Format) => void
  disabled?: boolean
}

const GROUPS: { format: Format; label: string; icon: typeof Bold }[][] = [
  [
    { format: "h1", label: "Título grande", icon: Heading1 },
    { format: "h2", label: "Título médio", icon: Heading2 },
    { format: "h3", label: "Título pequeno", icon: Heading3 },
  ],
  [
    { format: "bold", label: "Negrito  (Ctrl+B)", icon: Bold },
    { format: "italic", label: "Itálico  (Ctrl+I)", icon: Italic },
    { format: "strike", label: "Riscado", icon: Strikethrough },
    { format: "code", label: "Código", icon: Code },
    { format: "link", label: "Link  (Ctrl+K)", icon: Link2 },
  ],
  [
    { format: "bullet", label: "Lista", icon: List },
    { format: "ordered", label: "Lista numerada", icon: ListOrdered },
    { format: "checklist", label: "Checklist", icon: ListChecks },
    { format: "quote", label: "Citação", icon: Quote },
  ],
]

export function EditorToolbar({ onFormat, disabled }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border bg-muted/30 p-1">
      {GROUPS.map((group, index) => (
        <div key={index} className="flex items-center gap-0.5">
          {index > 0 && (
            <Separator orientation="vertical" className="mx-1 h-5" />
          )}
          {group.map((item) => (
            <Button
              key={item.format}
              type="button"
              variant="ghost"
              size="icon-sm"
              title={item.label}
              aria-label={item.label}
              disabled={disabled}
              // onMouseDown evita que o textarea perca a seleção ao clicar
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onFormat(item.format)}
            >
              <item.icon className="size-4" />
            </Button>
          ))}
        </div>
      ))}
    </div>
  )
}
