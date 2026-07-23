"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NewItemMenu } from "./new-item-menu"
import { SearchCommand } from "./search-command"

export function Topbar() {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Button
        variant="outline"
        className="h-9 w-full max-w-xs justify-start gap-2 text-muted-foreground"
        onClick={() => setSearchOpen(true)}
      >
        <Search className="size-4" />
        <span className="flex-1 text-left text-sm">Pesquisar...</span>
        <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          Ctrl K
        </kbd>
      </Button>
      <div className="ml-auto">
        <NewItemMenu />
      </div>
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
