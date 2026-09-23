import { ChatView } from "@/components/chat/chat-view"
import type { Message, ToolCall } from "@/components/chat/types"
import { createClient } from "@/lib/supabase/server"
import { carregarSettings, cofreLigado } from "@/lib/ai/settings"

export const dynamic = "force-dynamic"

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>
}) {
  const { thread } = await searchParams
  const supabase = await createClient()
  const settings = await carregarSettings(supabase)

  const { data: threads } = await supabase
    .from("chat_threads")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50)

  let messages: Message[] = []
  if (thread) {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, role, content, reasoning, tool_calls, tool_call_id")
      .eq("thread_id", thread)
      .order("created_at", { ascending: true })

    messages = (data ?? []).map((row) => ({
      id: row.id,
      role: row.role as Message["role"],
      content: row.content,
      reasoning: row.reasoning || undefined,
      toolCalls: (row.tool_calls as ToolCall[] | null) ?? undefined,
      toolCallId: row.tool_call_id ?? undefined,
    }))
  }

  return (
    <ChatView
      threads={threads ?? []}
      threadId={thread ?? null}
      initialMessages={messages}
      enabled={Boolean(settings.apiKey)}
      sources={{
        prism: true,
        cofre: cofreLigado(settings),
        web: Boolean(settings.tavilyKey),
      }}
    />
  )
}
