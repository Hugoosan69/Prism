import type { ComponentType, SVGProps } from "react"
import {
  IconChat,
  IconDashboard,
  IconFinancas,
  IconNotas,
  IconFavoritos,
  IconKanban,
  IconSQL,
  IconLinks,
} from "@/components/brand/pixel-icons"

export type PixelIcon = ComponentType<SVGProps<SVGSVGElement>>

export type NavModule = "pessoal" | "trabalho"

export type NavItem = {
  title: string
  href: string
  icon: PixelIcon
  accent: string
  module: NavModule
}

export const CHAT_ITEM = {
  title: "Chat",
  href: "/chat",
  icon: IconChat,
  accent: "var(--retro-green)",
} as const

export const DEFAULT_MODULE_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: IconDashboard,
    accent: "var(--spec-dashboard)",
    module: "pessoal",
  },
  {
    title: "Finanças",
    href: "/financas",
    icon: IconFinancas,
    accent: "var(--spec-financas)",
    module: "pessoal",
  },
  {
    title: "Notas",
    href: "/notas",
    icon: IconNotas,
    accent: "var(--spec-notas)",
    module: "pessoal",
  },
  {
    title: "Favoritos",
    href: "/favoritos",
    icon: IconFavoritos,
    accent: "var(--spec-favoritos)",
    module: "pessoal",
  },
  {
    title: "Kanban",
    href: "/kanban",
    icon: IconKanban,
    accent: "var(--spec-kanban)",
    module: "trabalho",
  },
  {
    title: "SQL",
    href: "/sql",
    icon: IconSQL,
    accent: "var(--spec-sql)",
    module: "trabalho",
  },
  {
    title: "Links",
    href: "/links",
    icon: IconLinks,
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
