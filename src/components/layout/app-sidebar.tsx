"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronRight, LogOut } from "lucide-react"
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
import { NAV_AREAS, SETTINGS_AREA, type NavArea } from "@/lib/navigation"
import { PrismMark } from "@/components/brand/prism-mark"

function isAreaActive(area: NavArea, pathname: string) {
  if (area.children?.length) {
    return area.children.some((child) => pathname.startsWith(child.href))
  }
  return pathname.startsWith(area.href)
}

/** Área com subdestinos (Conhecimento): abre o grupo quando algum filho está ativo. */
function AreaWithChildren({
  area,
  pathname,
}: {
  area: NavArea
  pathname: string
}) {
  const active = isAreaActive(area, pathname)
  return (
    <Collapsible defaultOpen={active} className="group/area">
      <SidebarMenuItem>
        <CollapsibleTrigger
          className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-sm font-medium outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
            active ? "text-sidebar-foreground" : ""
          }`}
        >
          <area.icon
            className="size-[15px] shrink-0"
            style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
          />
          <span>{area.title}</span>
          <ChevronRight className="ml-auto size-3.5 text-muted-foreground transition-transform group-data-[open]/area:rotate-90 group-data-[collapsible=icon]:hidden" />
        </CollapsibleTrigger>
      </SidebarMenuItem>
      <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
        <SidebarMenu className="mt-0.5 ml-5 gap-0.5 border-l border-sidebar-border pl-2.5">
          {area.children!.map((child) => {
            const childActive = pathname.startsWith(child.href)
            return (
              <SidebarMenuItem key={child.href}>
                <SidebarMenuButton
                  isActive={childActive}
                  render={<Link href={child.href} />}
                  className="h-7 gap-2 rounded-lg text-[13px] font-medium"
                >
                  <span>{child.title}</span>
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

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-11 items-center gap-2.5 px-2">
          <PrismMark className="size-7 shrink-0" />
          <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Prism
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-0.5">
            {NAV_AREAS.map((area) => {
              if (area.children?.length) {
                return (
                  <AreaWithChildren
                    key={area.href}
                    area={area}
                    pathname={pathname}
                  />
                )
              }
              const active = isAreaActive(area, pathname)
              return (
                <SidebarMenuItem key={area.href}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={area.title}
                    render={<Link href={area.href} />}
                    className="gap-2.5 rounded-lg font-medium"
                  >
                    <area.icon
                      className="size-[15px] shrink-0"
                      style={{
                        color: active
                          ? "var(--primary)"
                          : "var(--muted-foreground)",
                      }}
                    />
                    <span>{area.title}</span>
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
              isActive={pathname.startsWith(SETTINGS_AREA.href)}
              tooltip={SETTINGS_AREA.title}
              render={<Link href={SETTINGS_AREA.href} />}
              className="gap-2.5 rounded-lg font-medium"
            >
              <SETTINGS_AREA.icon
                className="size-[15px] shrink-0"
                style={{ color: "var(--muted-foreground)" }}
              />
              <span>{SETTINGS_AREA.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair do Prism"
              onClick={handleLogout}
              className="gap-2.5 rounded-lg font-medium text-muted-foreground hover:text-destructive"
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
