"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings } from "lucide-react"
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
import { NAV_ITEMS } from "@/lib/navigation"

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-11 items-center gap-2.5 px-2">
          <div className="prism-spectrum flex size-6 shrink-0 items-center justify-center rounded-[7px]">
            <span className="font-mono text-[11px] font-bold text-black/75">
              P
            </span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Prism
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                    className="relative gap-2.5 font-medium"
                  >
                    {/* A faixa do espectro marca onde você está */}
                    <span
                      aria-hidden
                      className="absolute top-1/2 left-0 h-4 w-[2px] -translate-y-1/2 rounded-full transition-opacity"
                      style={{
                        background: item.accent,
                        opacity: isActive ? 1 : 0,
                      }}
                    />
                    <item.icon
                      style={isActive ? { color: item.accent } : undefined}
                    />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
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
              className="gap-2.5 font-medium"
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
