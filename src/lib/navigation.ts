import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  LayoutDashboard,
  ListTodo,
  MessagesSquare,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react"

export type NavChild = { title: string; href: string }

export type NavArea = {
  title: string
  href: string
  icon: LucideIcon
  /** Subdestinos (ex.: Conhecimento agrupa Notas, SQL, Links, Favoritos). */
  children?: NavChild[]
}

/**
 * As sete áreas da central de demandas (linha Orvexa). A navegação é dado, não
 * código: reorganizar o menu é editar esta lista. As telas de cada área
 * continuam existindo por baixo — só mudam de lugar aqui.
 *
 * Configurações mora no rodapé (SETTINGS_AREA), não nesta lista.
 */
export const NAV_AREAS: NavArea[] = [
  { title: "Painel", href: "/painel", icon: LayoutDashboard },
  { title: "Demandas", href: "/kanban", icon: ListTodo },
  { title: "Conversas", href: "/conversas", icon: MessagesSquare },
  {
    title: "Conhecimento",
    href: "/notas",
    icon: BookOpen,
    children: [
      { title: "Notas", href: "/notas" },
      { title: "SQL", href: "/sql" },
      { title: "Links", href: "/links" },
      { title: "Favoritos", href: "/favoritos" },
    ],
  },
  { title: "Finanças", href: "/financas", icon: Wallet },
  { title: "Assistente", href: "/chat", icon: Sparkles },
]

export const SETTINGS_AREA: NavArea = {
  title: "Configurações",
  href: "/configuracoes",
  icon: Settings,
}

/**
 * Lista plana para usos legados (animação do login, buscas). Mantida para não
 * quebrar quem iterava a navegação antiga.
 */
export const NAV_ITEMS = NAV_AREAS.map((area) => ({
  title: area.title,
  href: area.href,
  accent: "var(--primary)",
}))
