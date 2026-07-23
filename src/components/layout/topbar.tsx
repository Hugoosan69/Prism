"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NewItemMenu } from "./new-item-menu"
import { SearchCommand } from "./search-command"

export function Topbar() {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-sm">
      <SidebarTrigger className="text-muted-foreground" />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <button
        onClick={() => setSearchOpen(true)}
        className="group flex h-8 w-full max-w-sm items-center gap-2 rounded-lg border border-input/60 bg-input/25 px-2.5 text-left transition-colors hover:border-input hover:bg-input/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm text-muted-foreground">
          Pesquisar
        </span>
        <kbd className="hidden shrink-0 rounded border border-border/70 px-1.5 py-px font-mono text-[10px] text-muted-foreground sm:block">
          Ctrl K
        </kbd>
      </button>
      <div className="ml-auto">
        <NewItemMenu />
      </div>
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
