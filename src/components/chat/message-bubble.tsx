"use client"

import { useEffect, useRef, useState } from "react"
import { Brain, ChevronRight, Copy, Check } from "lucide-react"
import { MarkdownPreview } from "@/components/notes/markdown-preview"
import { ProposalCard } from "./proposal-card"
import { TOOL_LABELS, type Message } from "./types"

export function MessageBubble({
  message,
  pending,
  animate,
  onResolveProposal,
}: {
  message: Message
  /** Resposta ainda em curso: a bolha mostra sinal de vida, não vazio. */
  pending?: boolean
  /** Resposta desta sessão: aparece sendo digitada. Histórico aparece pronto. */
  animate?: boolean
  onResolveProposal: (id: string, status: "aceita" | "recusada" | "desfeita") => void
}) {
  const [showReasoning, setShowReasoning] = useState(false)
  const [copied, setCopied] = useState(false)
  const revelado = useRevelacao(message.content, Boolean(animate))

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-[15px] whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Área de transferência bloqueada: o botão só não confirma.
    }
  }

  return (
    <div className="group/msg space-y-2.5">
      {message.reasoning && (
        <div>
          <button
            onClick={() => setShowReasoning((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Brain className="size-3" />
            Raciocínio
            <ChevronRight
              className={`size-3 transition-transform ${showReasoning ? "rotate-90" : ""}`}
            />
          </button>
          {showReasoning && (
            <p className="mt-2 border-l-2 pl-3 text-xs whitespace-pre-wrap text-muted-foreground">
              {message.reasoning}
            </p>
          )}
        </div>
      )}

      {message.content && revelado > 0 ? (
        <div className="text-[15px] leading-relaxed">
          <MarkdownPreview
            content={
              revelado < message.content.length
                ? `${message.content.slice(0, revelado)}▍`
                : message.content
            }
          />
        </div>
      ) : pending ? (
        // O modelo leva de 10 a 20 segundos para o primeiro token. Sem isto a
        // bolha fica vazia todo esse tempo, o que parece travamento — e leva a
        // clicar no botão de parar achando que é enviar.
        <Pensando reasoning={message.reasoning} />
      ) : (
        <p className="text-[13px] text-muted-foreground italic">
          Sem resposta — a geração foi interrompida.
        </p>
      )}

      {message.proposals?.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onResolve={onResolveProposal}
        />
      ))}

      <div className="flex items-center gap-3">
        {message.content && revelado >= message.content.length && (
          <button
            onClick={copy}
            aria-label="Copiar resposta"
            className="text-muted-foreground opacity-0 transition hover:text-foreground focus-visible:opacity-100 group-hover/msg:opacity-100"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        )}
        {message.usedTools && message.usedTools.length > 0 && (
          <p className="font-mono text-[11px] text-muted-foreground">
            {message.usedTools
              .map((tool) => TOOL_LABELS[tool] ?? tool)
              .join(" · ")}
          </p>
        )}
      </div>
    </div>
  )
}

/** Caracteres por segundo da revelação, em ritmo de leitura. */
const VELOCIDADE = 130
/** Atraso máximo tolerado, em segundos: acima disso ela acelera para alcançar. */
const ATRASO_MAXIMO = 1.2
/** Intervalo entre repinturas. Reduz o custo de remontar o Markdown a cada quadro. */
const PASSO_MS = 45

/**
 * Revela o texto aos poucos, sem mexer no texto de verdade.
 *
 * A animação vive só na camada de exibição: o conteúdo completo já está no
 * estado e a caminho do banco desde que chegou. Se a aba perder o foco ou a
 * revelação engasgar, o que vale continua sendo o texto inteiro — nada do que
 * se vê aqui é fonte de dado.
 *
 * A velocidade tem piso e teto. VELOCIDADE dá o ritmo confortável, mas quando o
 * modelo despeja um bloco grande de uma vez a revelação acelera o bastante para
 * nunca ficar mais de ATRASO_MAXIMO atrás; sem isso uma resposta longa
 * continuaria "digitando" muito depois de o streaming ter acabado.
 */
function useRevelacao(texto: string, animar: boolean) {
  const [ate, setAte] = useState(() => (animar ? 0 : texto.length))
  const ateRef = useRef(ate)
  const textoRef = useRef(texto)
  textoRef.current = texto

  useEffect(() => {
    // Mensagem carregada do banco aparece pronta: animar o histórico faria a
    // conversa se redigitar sozinha a cada vez que Hugo a reabre.
    if (!animar) {
      ateRef.current = textoRef.current.length
      setAte(ateRef.current)
      return
    }

    // O navegador congela requestAnimationFrame em aba de segundo plano. Ao
    // voltar, Hugo quer a resposta pronta, não assistir à redigitação do que
    // ele perdeu enquanto estava em outra aba.
    const aoVoltar = () => {
      if (document.visibilityState !== "visible") return
      ateRef.current = textoRef.current.length
      setAte(ateRef.current)
    }
    document.addEventListener("visibilitychange", aoVoltar)

    let frame = 0
    let anterior = performance.now()
    let desdeUltimaPintura = 0

    const passo = (agora: number) => {
      frame = requestAnimationFrame(passo)

      // Teto no delta: voltar de uma aba em segundo plano não deve revelar
      // tudo de um golpe só porque o relógio andou.
      const dt = Math.min((agora - anterior) / 1000, 0.25)
      anterior = agora

      const alvo = textoRef.current.length
      if (ateRef.current > alvo) {
        // O texto encolheu (um erro substituiu a resposta): acompanha.
        ateRef.current = alvo
        setAte(alvo)
        return
      }
      if (ateRef.current >= alvo) return

      const falta = alvo - ateRef.current
      const ritmo = Math.max(VELOCIDADE, falta / ATRASO_MAXIMO)
      ateRef.current = Math.min(alvo, ateRef.current + ritmo * dt)

      desdeUltimaPintura += dt * 1000
      if (desdeUltimaPintura >= PASSO_MS || ateRef.current >= alvo) {
        desdeUltimaPintura = 0
        setAte(ateRef.current)
      }
    }

    frame = requestAnimationFrame(passo)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("visibilitychange", aoVoltar)
    }
  }, [animar])

  return Math.floor(ate)
}

/** Sinal de vida enquanto o modelo pensa, mostrando o raciocínio que já chegou. */
function Pensando({ reasoning }: { reasoning?: string }) {
  const ultimo = reasoning?.trim().split("\n").at(-1) ?? ""

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex gap-1">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </span>
        Pensando
      </p>
      {ultimo && (
        <p className="line-clamp-2 border-l-2 pl-3 text-xs text-muted-foreground/80">
          {ultimo}
        </p>
      )}
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
      style={{ animationDelay: delay }}
    />
  )
}
