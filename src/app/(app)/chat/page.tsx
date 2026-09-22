import { PageHeader } from "@/components/layout/page-header"
import { ChatView } from "@/components/chat/chat-view"
import type { Message, ToolCall } from "@/components/chat/types"
import { createClient } from "@/lib/supabase/server"
import { chatEnabled, vaultEnabled, webSearchEnabled } from "@/lib/ai/config"

export const dynamic = "force-dynamic"

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>
}) {
  const { thread } = await searchParams
  const supabase = await createClient()

  const { data: threads } = await supabase
    .from("chat_threads")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(15)

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

  // Uma linha só, para saber de relance o que o assistente alcança hoje.
  const sources = [
    "Prism",
    vaultEnabled() ? "Segundo Cérebro" : null,
    webSearchEnabled() ? "web" : null,
  ].filter(Boolean)

  return (
    <div>
      <PageHeader title="Chat" meta={sources.join(" · ")} />
      <ChatView
        threads={threads ?? []}
        threadId={thread ?? null}
        initialMessages={messages}
        enabled={chatEnabled()}
      />
    </div>
  )
}
