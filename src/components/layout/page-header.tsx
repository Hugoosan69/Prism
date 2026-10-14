"use client"

import { usePathname } from "next/navigation"
import { accentForPath } from "@/lib/navigation"

type Props = {
  title: string
  /** Contagem ou estado do módulo, em mono para não dançar ao atualizar */
  meta?: string
  children?: React.ReactNode
}

export function PageHeader({ title, meta, children }: Props) {
  const accent = accentForPath(usePathname())

  return (
    <div className="mb-6 flex items-center gap-3">
      <span
        aria-hidden
        className="h-5 w-[3px] shrink-0"
        style={{ background: accent }}
      />
      <h1 className="font-pixel text-[13px] tracking-[1px] uppercase">{title}</h1>
      {meta && (
        <span className="font-mono text-xs text-muted-foreground">{meta}</span>
      )}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  )
}
