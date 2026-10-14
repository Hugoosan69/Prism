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
      <div className="border-2 border-[#2b3060] bg-retro-panel retro-shadow transition-colors focus-within:border-ring">
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
          className="field-sizing-fixed max-h-56 min-h-11 resize-none border-0 bg-transparent px-4 py-3 text-[15px] shadow-none focus-visible:ring-0"
        />

        <div className="flex flex-wrap items-center gap-2 px-3 pb-2.5">
          <div className="flex items-center gap-2">
            <FonteRetro ligada icone={Database} nome="PRISM" porque="Suas consultas, notas, tarefas e links" />
            <FonteRetro
              ligada={sources.cofre}
              icone={BookOpen}
              nome="COFRE"
              porque="Segundo Cérebro, no Google Drive"
              seDesligada="Desligado: faltam GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_REFRESH_TOKEN no ambiente onde o Prism está rodando."
            />
            <FonteRetro
              ligada={sources.web}
              icone={Globe}
              nome="WEB"
              porque="Busca na web"
              seDesligada="Desligado: sem chave da Tavily, nem em Configurações nem no ambiente."
            />
          </div>

          <div className="ml-auto">
            {streaming ? (
              <span className="flex items-center gap-2">
                <span className="font-pixel text-[8px] text-muted-foreground">
                  respondendo…
                </span>
                <button
                  onClick={onStop}
                  aria-label="Parar resposta"
                  title="Parar resposta"
                  className="flex size-8 items-center justify-center border-2 border-border bg-muted text-foreground transition-colors hover:bg-muted/70"
                >
                  <Square className="size-3 fill-current" />
                </button>
              </span>
            ) : (
              <button
                onClick={onSend}
                disabled={disabled || !value.trim()}
                aria-label="Enviar"
                className="bg-retro-green border-2 border-[#3fae59] text-[#07140c] font-pixel text-[9px] px-3 py-2 retro-shadow transition-opacity hover:brightness-110 disabled:opacity-30"
              >
                ENVIAR
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

/**
 * Selo de uma fonte de consulta.
 *
 * A desligada continua na linha, apagada e riscada, com o motivo no title. É a
 * diferença entre descobrir que falta uma chave e achar que o chat quebrou.
 */
function FonteRetro({
  ligada,
  icone: Icone,
  nome,
  porque,
  seDesligada,
}: {
  ligada: boolean
  icone: React.ElementType
  nome: string
  porque: string
  seDesligada?: string
}) {
  return (
    <span
      title={ligada ? porque : (seDesligada ?? porque)}
      className={`inline-flex items-center gap-1.5 font-pixel text-[8px] px-2 py-1.5 border-2 ${
        ligada
          ? "border-[#2d6b3f] text-retro-green"
          : "border-[#23263f] text-[#4a4f72] line-through decoration-1"
      }`}
    >
      <Icone className="size-3" />
      {nome}
    </span>
  )
}
