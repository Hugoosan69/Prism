import {
  Bookmark,
  Database,
  FolderOpen,
  LayoutDashboard,
  SquareKanban,
  StickyNote,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  /** Faixa do espectro do módulo; ver globals.css */
  accent: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    accent: "var(--spec-dashboard)",
  },
  {
    title: "Kanban",
    href: "/kanban",
    icon: SquareKanban,
    accent: "var(--spec-kanban)",
  },
  { title: "SQL", href: "/sql", icon: Database, accent: "var(--spec-sql)" },
  {
    title: "Arquivos",
    href: "/arquivos",
    icon: FolderOpen,
    accent: "var(--spec-arquivos)",
  },
  {
    title: "Notas",
    href: "/notas",
    icon: StickyNote,
    accent: "var(--spec-notas)",
  },
  {
    title: "Favoritos",
    href: "/favoritos",
    icon: Bookmark,
    accent: "var(--spec-favoritos)",
  },
]

export function accentForPath(pathname: string) {
  return (
    NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.accent ??
    "var(--spec-dashboard)"
  )
}
