"use client"

import { useEffect, useRef } from "react"
import { ArrowUp, Globe, Database, BookOpen, Square } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  streaming: boolean
  disabled: boolean
  /** Fontes ligadas, mostradas como selo discreto abaixo do campo. */
  sources: { prism: boolean; cofre: boolean; web: boolean }
  autoFocus?: boolean
  /** A dica de teclado só aparece na tela inicial; depois vira ruído. */
  hint?: boolean
}

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  streaming,
  disabled,
  sources,
  autoFocus,
  hint,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  return (
    <div>
      <div className="rounded-2xl border bg-card shadow-sm transition-colors focus-within:border-ring">
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          disabled={disabled}
          rows={1}
          placeholder="Pergunte alguma coisa…"
          // field-sizing-fixed: sem isso o Textarea do shadcn cresce sem teto e
          // empurra os botões para fora da tela num texto longo.
          className="field-sizing-fixed max-h-56 min-h-11 resize-none border-0 bg-transparent px-4 py-3 text-[15px] shadow-none focus-visible:ring-0"
        />

        <div className="flex items-center gap-2 px-3 pb-2.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span
              className="flex items-center gap-1 text-[11px]"
              title="Suas consultas, notas, tarefas e links"
            >
              <Database className="size-3" />
              Prism
            </span>
            {sources.cofre && (
              <span
                className="flex items-center gap-1 text-[11px]"
                title="Segundo Cérebro, no Google Drive"
              >
                <BookOpen className="size-3" />
                Cofre
              </span>
            )}
            {sources.web && (
              <span className="flex items-center gap-1 text-[11px]" title="Busca na web">
                <Globe className="size-3" />
                Web
              </span>
            )}
          </div>

          <div className="ml-auto">
            {streaming ? (
              <button
                onClick={onStop}
                aria-label="Parar"
                className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/70"
              >
                <Square className="size-3 fill-current" />
              </button>
            ) : (
              <button
                onClick={onSend}
                disabled={disabled || !value.trim()}
                aria-label="Enviar"
                className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {hint && (
        <p className="mt-1.5 px-1 text-center text-[11px] text-muted-foreground">
          Enter envia · Shift+Enter quebra linha
        </p>
      )}
    </div>
  )
}
