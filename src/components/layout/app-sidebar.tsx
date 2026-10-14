"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Settings, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { CHAT_ITEM, DEFAULT_MODULE_ITEMS, type NavItem } from "@/lib/navigation"
import { PrismMark } from "@/components/brand/prism-mark"

function ModuleGroup({
  label,
  color,
  items,
  pathname,
}: {
  label: string
  color: string
  items: NavItem[]
  pathname: string
}) {
  return (
    <Collapsible defaultOpen className="group/module">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-1.5 group-data-[collapsible=icon]:hidden">
        <span
          className="font-pixel text-[8px] tracking-[1px] uppercase"
          style={{ color }}
        >
          {label}
        </span>
        <ChevronDown
          className="ml-auto size-3 -rotate-90 transition-transform group-data-[open]/module:rotate-0"
          style={{ color }}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu className="gap-0.5 border-l-2 ml-3 pl-1" style={{ borderColor: `${color}33` }}>
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.title}
                  render={<Link href={item.href} />}
                  className="relative gap-2.5 font-medium"
                >
                  <span
                    aria-hidden
                    className="absolute top-1/2 left-0 h-4 w-[2px] -translate-y-1/2 transition-opacity"
                    style={{
                      background: color,
                      opacity: isActive ? 1 : 0,
                    }}
                  />
                  <item.icon
                    className="size-4"
                    style={isActive ? { color } : undefined}
                  />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const pessoal = DEFAULT_MODULE_ITEMS.filter((i) => i.module === "pessoal")
  const trabalho = DEFAULT_MODULE_ITEMS.filter((i) => i.module === "trabalho")

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const chatActive = pathname.startsWith(CHAT_ITEM.href)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-11 items-center gap-2.5 px-2">
          <PrismMark className="size-6 shrink-0" />
          <span className="font-pixel text-[10px] tracking-[1px] group-data-[collapsible=icon]:hidden">
            PRISM
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Chat fica fora dos grupos */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={chatActive}
                tooltip={CHAT_ITEM.title}
                render={<Link href={CHAT_ITEM.href} />}
                className="gap-2.5 font-medium"
              >
                <CHAT_ITEM.icon
                  className="size-4"
                  style={chatActive ? { color: "var(--retro-green)" } : undefined}
                />
                <span>{CHAT_ITEM.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <ModuleGroup
            label="Pessoal"
            color="var(--retro-green)"
            items={pessoal}
            pathname={pathname}
          />
        </SidebarGroup>

        <SidebarGroup>
          <ModuleGroup
            label="Trabalho"
            color="var(--retro-amber)"
            items={trabalho}
            pathname={pathname}
          />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/configuracoes")}
              tooltip="Configurações"
              render={<Link href="/configuracoes" />}
              className="gap-2.5 font-medium"
            >
              <Settings className="size-4" />
              <span>Configurações</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair do Prism"
              onClick={handleLogout}
              className="gap-2.5 font-medium text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
