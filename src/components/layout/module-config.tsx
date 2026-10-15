"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import { DEFAULT_MODULE_ITEMS, type NavModule } from "@/lib/navigation"
import { useModuleConfig } from "@/lib/use-module-config"

export function ModuleConfig() {
  const { moduleMap, setModule, reset } = useModuleConfig()

  const pessoal = DEFAULT_MODULE_ITEMS.filter(
    (i) => (moduleMap[i.href] ?? i.module) === "pessoal"
  )
  const trabalho = DEFAULT_MODULE_ITEMS.filter(
    (i) => (moduleMap[i.href] ?? i.module) === "trabalho"
  )

  function move(href: string, to: NavModule) {
    setModule(href, to)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Column
          label="Pessoal"
          color="var(--retro-green)"
          items={pessoal}
          onMove={(href) => move(href, "trabalho")}
          direction="right"
        />
        <Column
          label="Trabalho"
          color="var(--retro-amber)"
          items={trabalho}
          onMove={(href) => move(href, "pessoal")}
          direction="left"
        />
      </div>
      <button
        onClick={reset}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Restaurar padrão
      </button>
    </div>
  )
}

function Column({
  label,
  color,
  items,
  onMove,
  direction,
}: {
  label: string
  color: string
  items: typeof DEFAULT_MODULE_ITEMS
  onMove: (href: string) => void
  direction: "left" | "right"
}) {
  return (
    <div className="border-2 border-border bg-retro-panel p-3 space-y-2">
      <span
        className="font-pixel text-[9px] tracking-[1px] uppercase"
        style={{ color }}
      >
        {label}
      </span>
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.href}
            className="flex items-center justify-between gap-2 border-2 border-retro-border-muted bg-retro-surface-sunken px-2.5 py-1.5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <item.icon width={12} height={12} className="shrink-0" style={{ color }} />
              <span className="text-sm truncate">{item.title}</span>
            </div>
            <button
              onClick={() => onMove(item.href)}
              className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Mover ${item.title} para ${direction === "right" ? "Trabalho" : "Pessoal"}`}
            >
              {direction === "right" ? (
                <ArrowRight className="size-3.5" />
              ) : (
                <ArrowLeft className="size-3.5" />
              )}
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-3 text-center text-xs text-muted-foreground">
            Nenhum módulo
          </p>
        )}
      </div>
    </div>
  )
}
