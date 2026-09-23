/** Formato das mensagens na tela e no que sobe para /api/chat. */

export type ToolCall = {
  id: string
  type: "function"
  function: { name: string; arguments: string }
}

/** Como desfazer o que o assistente gravou sozinho. */
export type Desfazer =
  | { tipo: "apagar"; tabela: "tasks" | "notes" | "snippets" | "links"; id: string }
  | { tipo: "restaurar_nota"; id: string; conteudo: string; titulo: string }
  | { tipo: "nenhum" }

export type Proposal = {
  id: string
  tool: string
  args: Record<string, unknown>
  /**
   * "pendente" espera Hugo. "feita" é ação direta: já está no banco, e o card
   * serve para ele ver o que aconteceu e poder desfazer.
   */
  status: "pendente" | "aceita" | "recusada" | "feita" | "desfeita"
  /** Só em "feita": o que a escrita produziu e como voltar atrás. */
  resumo?: string
  desfazer?: Desfazer
}

export type Message = {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  reasoning?: string
  toolCalls?: ToolCall[]
  toolCallId?: string
  /** Nome das ferramentas de leitura usadas, para a linha de rodapé. */
  usedTools?: string[]
  proposals?: Proposal[]
}

export type StreamEvent =
  | { type: "reasoning"; text: string }
  | { type: "content"; text: string }
  | { type: "tool"; name: string; status: "running" | "done" }
  | { type: "proposal"; id: string; tool: string; args: Record<string, unknown> }
  | {
      type: "executed"
      id: string
      tool: string
      args: Record<string, unknown>
      resumo: string
      desfazer: Desfazer
    }
  | { type: "error"; message: string }
  | { type: "done" }

export const TOOL_LABELS: Record<string, string> = {
  buscar_no_prism: "Buscando no Prism",
  ler_item_do_prism: "Lendo item do Prism",
  cofre_indices: "Lendo os índices do cofre",
  cofre_buscar: "Buscando no Segundo Cérebro",
  cofre_ler: "Lendo nota do cofre",
  buscar_na_web: "Buscando na web",
}
