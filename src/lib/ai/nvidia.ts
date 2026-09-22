/**
 * Cliente da API da NVIDIA (endpoint compatível com o formato da OpenAI).
 *
 * Feito com fetch puro de propósito: o SDK `openai` traria uma árvore de
 * dependências inteira para o que aqui é um POST e um parser de SSE. Se um dia
 * precisarmos de mais do que chat completions, a troca é isolada neste arquivo.
 */

import { NVIDIA_API_KEY, NVIDIA_BASE_URL, NVIDIA_MODEL } from "./config"

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
  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    signal,
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages,
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
      stream: true,
      ...(tools.length > 0 ? { tools, tool_choice: "auto" } : {}),
      chat_template_kwargs: { enable_thinking: true },
    }),
  })

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "")
    throw new Error(
      `NVIDIA respondeu ${response.status}: ${detail.slice(0, 500)}`
    )
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const pending = new Map<number, ToolCall>()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE separa eventos por linha em branco, mas a NVIDIA manda um "data:" por
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

      if (delta.reasoning_content) {
        yield { type: "reasoning", text: delta.reasoning_content }
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
