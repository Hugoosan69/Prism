/**
 * A única rota de API do Prism.
 *
 * O resto do app fala com o Supabase direto do client, sem camada de API — mas
 * a chave da NVIDIA não pode existir no navegador, então o chat precisa de um
 * servidor. A exceção começa e termina aqui.
 *
 * Devolve um stream de linhas JSON (NDJSON) em vez de SSE: o consumidor é um
 * único componente nosso, e uma linha por evento é mais simples de ler dos dois
 * lados do que o protocolo de eventos do SSE.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { chatEnabled, MAX_TOOL_ROUNDS } from "@/lib/ai/config"
import { SYSTEM_PROMPT } from "@/lib/ai/prompt"
import { streamChat, type ChatMessage, type ToolCall } from "@/lib/ai/nvidia"
import { availableTools, runReadTool, WRITE_TOOL_NAMES } from "@/lib/ai/tools"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Evento que sobe para a tela. */
type Event =
  | { type: "reasoning"; text: string }
  | { type: "content"; text: string }
  | { type: "tool"; name: string; status: "running" | "done" }
  | { type: "proposal"; id: string; tool: string; args: Record<string, unknown> }
  | { type: "error"; message: string }
  | { type: "done" }

type Incoming = {
  role: "user" | "assistant" | "tool"
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export async function POST(request: NextRequest) {
  if (!chatEnabled()) {
    return NextResponse.json(
      { error: "NVIDIA_API_KEY não configurada. Ver .env.example." },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // O middleware já protege as páginas, mas ele não cobre /api — sem esta
  // checagem a rota seria um proxy aberto para a chave da NVIDIA.
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  let body: { messages?: Incoming[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
  }

  const history = body.messages ?? []
  if (history.length === 0) {
    return NextResponse.json({ error: "Sem mensagens." }, { status: 400 })
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m): ChatMessage => {
      if (m.role === "tool") {
        return {
          role: "tool",
          content: m.content,
          tool_call_id: m.tool_call_id ?? "",
        }
      }
      if (m.role === "assistant") {
        return {
          role: "assistant",
          content: m.content,
          ...(m.tool_calls?.length ? { tool_calls: m.tool_calls } : {}),
        }
      }
      return { role: "user", content: m.content }
    }),
  ]

  const encoder = new TextEncoder()
  const tools = availableTools()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Event) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }

      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          let text = ""
          let calls: ToolCall[] = []

          for await (const chunk of streamChat(
            messages,
            tools,
            request.signal
          )) {
            if (chunk.type === "reasoning") {
              send({ type: "reasoning", text: chunk.text })
            } else if (chunk.type === "content") {
              text += chunk.text
              send({ type: "content", text: chunk.text })
            } else {
              calls = chunk.calls
            }
          }

          if (calls.length === 0) {
            send({ type: "done" })
            return
          }

          messages.push({ role: "assistant", content: text, tool_calls: calls })

          for (const call of calls) {
            const name = call.function.name
            let args: Record<string, unknown> = {}
            try {
              args = JSON.parse(call.function.arguments || "{}")
            } catch {
              // Argumento malformado é problema do modelo, não motivo para
              // derrubar a resposta: devolvemos o erro como resultado.
              messages.push({
                role: "tool",
                tool_call_id: call.id,
                content: JSON.stringify({
                  erro: "Argumentos não são JSON válido.",
                }),
              })
              continue
            }

            if (WRITE_TOOL_NAMES.has(name)) {
              // Escrita não acontece no servidor: vira card de confirmação.
              send({ type: "proposal", id: call.id, tool: name, args })
              messages.push({
                role: "tool",
                tool_call_id: call.id,
                content: JSON.stringify({
                  status:
                    "Proposta apresentada a Hugo. Aguardando a confirmação dele na tela; nada foi gravado ainda.",
                }),
              })
              continue
            }

            send({ type: "tool", name, status: "running" })
            const result = await runReadTool(name, args, supabase)
            send({ type: "tool", name, status: "done" })

            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify(result).slice(0, 60000),
            })
          }
        }

        send({
          type: "error",
          message: `A resposta passou de ${MAX_TOOL_ROUNDS} rodadas de ferramenta e foi interrompida.`,
        })
        send({ type: "done" })
      } catch (error) {
        send({
          type: "error",
          message:
            error instanceof Error ? error.message : "Falha ao falar com o modelo.",
        })
        send({ type: "done" })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}
