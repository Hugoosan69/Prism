import {
  Bookmark,
  Database,
  MessageSquare,
  FolderOpen,
  LayoutDashboard,
  SquareKanban,
  StickyNote,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export type NavModule = "pessoal" | "trabalho"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  accent: string
  module: NavModule
}

export const CHAT_ITEM = {
  title: "Chat",
  href: "/chat",
  icon: MessageSquare,
  accent: "var(--retro-green)",
} as const

export const DEFAULT_MODULE_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    accent: "var(--spec-dashboard)",
    module: "pessoal",
  },
  {
    title: "Finanças",
    href: "/financas",
    icon: Wallet,
    accent: "var(--spec-financas)",
    module: "pessoal",
  },
  {
    title: "Notas",
    href: "/notas",
    icon: StickyNote,
    accent: "var(--spec-notas)",
    module: "pessoal",
  },
  {
    title: "Favoritos",
    href: "/favoritos",
    icon: Bookmark,
    accent: "var(--spec-favoritos)",
    module: "pessoal",
  },
  {
    title: "Kanban",
    href: "/kanban",
    icon: SquareKanban,
    accent: "var(--spec-kanban)",
    module: "trabalho",
  },
  {
    title: "SQL",
    href: "/sql",
    icon: Database,
    accent: "var(--spec-sql)",
    module: "trabalho",
  },
  {
    title: "Links",
    href: "/links",
    icon: FolderOpen,
    accent: "var(--spec-arquivos)",
    module: "trabalho",
  },
]

/** Flat list for backwards compat (search, topbar, login animation, etc.) */
export const NAV_ITEMS = [
  { ...CHAT_ITEM, module: "pessoal" as NavModule },
  ...DEFAULT_MODULE_ITEMS,
]

export function accentForPath(pathname: string) {
  if (pathname.startsWith("/chat")) return CHAT_ITEM.accent
  return (
    DEFAULT_MODULE_ITEMS.find((item) => pathname.startsWith(item.href))?.accent ??
    "var(--retro-green)"
  )
}
