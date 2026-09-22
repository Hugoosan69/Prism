/**
 * Cliente do modelo de linguagem.
 *
 * Fala com qualquer endpoint no formato da OpenAI — hoje a própria OpenAI.
 * Feito com
 * fetch puro de propósito: o SDK traria uma árvore de dependências inteira para
 * o que aqui é um POST e um parser de SSE. Trocar de provedor é mexer nas três
 * constantes de `config.ts`, e foi por isso que este arquivo não tem o nome de
 * nenhum fornecedor: o Prism já trocou duas vezes em um dia.
 */

import { AI_API_KEY, AI_BASE_URL, AI_MODEL, MAX_TOKENS } from "./config"

export type ToolCall = {
  id: string
  type: "function"
  function: { name: string; arguments: string }
}

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: ToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string }

export type ToolSchema = {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

/** Pedaço do stream, já normalizado para o que a rota precisa repassar. */
export type StreamChunk =
  | { type: "reasoning"; text: string }
  | { type: "content"; text: string }
  | { type: "tool_calls"; calls: ToolCall[] }

type DeltaToolCall = {
  index: number
  id?: string
  function?: { name?: string; arguments?: string }
}

/** Erro que a rota traduz para uma frase útil na tela. */
export class ModelError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

function explicar(status: number, corpo: string): string {
  if (status === 429) {
    return (
      "O provedor recusou por limite de uso ou saldo. Se a conta tiver " +
      "crédito, é só tentar de novo em alguns segundos."
    )
  }
  if (status === 401 || status === 403) {
    return "A chave da API do modelo foi recusada. Confira OPENAI_API_KEY."
  }
  if (status === 404) {
    return `O modelo "${AI_MODEL}" não existe nesse provedor.`
  }
  return `O provedor do modelo respondeu ${status}: ${corpo.slice(0, 300)}`
}

/**
 * Faz uma rodada de chat com streaming.
 *
 * O `tool_calls` chega fatiado no stream — cada delta traz um pedaço do JSON de
 * argumentos, identificado pelo índice. Por isso eles são acumulados aqui e só
 * emitidos no fim, inteiros: entregar pela metade quebraria o JSON.parse de
 * quem executa a ferramenta.
 */
export async function* streamChat(
  messages: ChatMessage[],
  tools: ToolSchema[],
  signal?: AbortSignal
): AsyncGenerator<StreamChunk> {
  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    signal,
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: 1,
      top_p: 0.95,
      // `max_tokens` foi aposentado: os modelos da série 5 recusam o pedido
      // com 400. `max_completion_tokens` é aceito tanto por eles quanto pelos
      // da série 4, então serve para qualquer modelo que venha depois.
      max_completion_tokens: MAX_TOKENS,
      stream: true,
      ...(tools.length > 0 ? { tools, tool_choice: "auto" } : {}),
    }),
  })

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "")
    throw new ModelError(explicar(response.status, detail), response.status)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const pending = new Map<number, ToolCall>()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE separa eventos por linha em branco, mas o que chega é um "data:" por
    // linha; quebrar por \n e ignorar o resto é suficiente e mais tolerante.
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue

      const payload = trimmed.slice(5).trim()
      if (payload === "[DONE]") continue

      let parsed: {
        choices?: {
          delta?: {
            content?: string | null
            /** Nomes usados por provedores diferentes para o mesmo campo. */
            reasoning?: string | null
            reasoning_content?: string | null
            tool_calls?: DeltaToolCall[]
          }
        }[]
      }
      try {
        parsed = JSON.parse(payload)
      } catch {
        // Linha cortada no meio pelo chunk anterior: o buffer já cuida disso,
        // então aqui só resta descartar ruído.
        continue
      }

      const delta = parsed.choices?.[0]?.delta
      if (!delta) continue

      const pensamento = delta.reasoning ?? delta.reasoning_content
      if (pensamento) {
        yield { type: "reasoning", text: pensamento }
      }
      if (delta.content) {
        yield { type: "content", text: delta.content }
      }
      for (const call of delta.tool_calls ?? []) {
        const current = pending.get(call.index) ?? {
          id: "",
          type: "function" as const,
          function: { name: "", arguments: "" },
        }
        if (call.id) current.id = call.id
        if (call.function?.name) current.function.name = call.function.name
        if (call.function?.arguments) {
          current.function.arguments += call.function.arguments
        }
        pending.set(call.index, current)
      }
    }
  }

  if (pending.size > 0) {
    yield {
      type: "tool_calls",
      calls: [...pending.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, call]) => call),
    }
  }
}
