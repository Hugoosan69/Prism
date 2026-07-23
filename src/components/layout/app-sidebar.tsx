"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bookmark,
  Database,
  FolderOpen,
  LayoutDashboard,
  Settings,
  SquareKanban,
  StickyNote,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Kanban", href: "/kanban", icon: SquareKanban },
  { title: "SQL", href: "/sql", icon: Database },
  { title: "Arquivos", href: "/arquivos", icon: FolderOpen },
  { title: "Notas", href: "/notas", icon: StickyNote },
  { title: "Favoritos", href: "/favoritos", icon: Bookmark },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-10 items-center gap-2 px-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary font-mono text-xs font-bold text-primary-foreground">
            P
          </div>
          <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
            Prism
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.title}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/configuracoes")}
              tooltip="Configurações"
              render={<Link href="/configuracoes" />}
            >
              <Settings />
              <span>Configurações</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
