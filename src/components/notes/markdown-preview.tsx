"use client"

import { isValidElement, useState, type ComponentProps, type ReactNode } from "react"
import { Check, Copy } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="text-sm text-muted-foreground">Nada para visualizar.</p>
    )
  }

  return (
    <div className="prose prose-neutral prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: BlocoDeCodigo }}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

/**
 * Junta o texto de uma árvore de nós.
 *
 * O botão precisa do código **cru**, e o que chega aqui é o `<code>` já virado
 * em elementos React. Ler `children` recursivamente devolve exatamente o que
 * estava entre as crases, sem as marcações que o realce acrescentou.
 */
function textoDe(node: ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textoDe).join("")
  if (isValidElement(node)) {
    return textoDe((node.props as { children?: ReactNode }).children)
  }
  return ""
}

/** "language-sql" -> "sql". O bloco sem linguagem marcada não mostra rótulo. */
function linguagemDe(node: ReactNode): string {
  if (!isValidElement(node)) return ""
  const className = (node.props as { className?: string }).className ?? ""
  return /language-([\w-]+)/.exec(className)?.[1] ?? ""
}

/**
 * Bloco de código com botão de copiar.
 *
 * Consulta de SQL é feita para sair daqui e entrar num editor — selecionar com
 * o mouse um bloco que rola é justamente onde se perde a primeira ou a última
 * linha. O botão fica discreto e firma no hover, em vez de aparecer do nada.
 */
function BlocoDeCodigo({ children, className, ...props }: ComponentProps<"pre">) {
  const [copiado, setCopiado] = useState(false)
  // O cursor da digitação vive dentro do texto enquanto a resposta é revelada.
  // Copiar no meio do streaming não deve levar esse caractere junto.
  const codigo = textoDe(children).replace(/▍/g, "")
  const linguagem = linguagemDe(children)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      // Área de transferência bloqueada: o botão só não confirma.
    }
  }

  return (
    <div className="group/code relative">
      {linguagem && (
        <span className="pointer-events-none absolute top-2.5 left-3.5 font-mono text-[10px] tracking-wider text-muted-foreground/60 uppercase">
          {linguagem}
        </span>
      )}
      <button
        type="button"
        onClick={copiar}
        aria-label={copiado ? "Copiado" : "Copiar código"}
        className="absolute top-2 right-2 rounded-md border bg-background/80 p-1.5 text-muted-foreground opacity-60 backdrop-blur transition hover:text-foreground focus-visible:opacity-100 group-hover/code:opacity-100"
      >
        {copiado ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
      <pre {...props} className={`${className ?? ""} ${linguagem ? "pt-7" : ""}`}>
        {children}
      </pre>
    </div>
  )
}
