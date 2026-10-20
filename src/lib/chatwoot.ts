// Chatwoot API v1 client — fetch puro, sem SDK.
// Usado exclusivamente pela edge function `conectar` (que lê o token do Vault).

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ChatwootInbox = {
  id: number
  name: string
  channel_type: string
  medium?: string | null
  avatar_url?: string
  email?: string | null
  phone_number?: string | null
  greeting_enabled?: boolean
  greeting_message?: string | null
}

export type ChatwootContact = {
  id: number
  name: string
  email?: string | null
  phone_number?: string | null
  thumbnail?: string | null
  availability_status?: string
}

export type ChatwootMessage = {
  id: number
  content: string | null
  account_id: number
  inbox_id: number
  conversation_id: number
  message_type: number // 0=incoming 1=outgoing 2=activity 3=template
  created_at: number
  private: boolean
  status?: string | null
  content_type?: string | null
  sender_type?: string | null
  sender?: { id: number; name?: string; avatar_url?: string; type?: string } | null
  attachments?: { id: number; file_type: string; data_url: string }[]
}

export type ChatwootConversation = {
  id: number
  account_id: number
  inbox_id: number
  status: "open" | "resolved" | "pending"
  muted: boolean
  unread_count: number
  created_at: number
  updated_at: number
  last_activity_at: number
  last_non_activity_message?: ChatwootMessage | null
  labels: string[]
  priority?: string | null
  meta: {
    sender: ChatwootContact
    channel?: string
    assignee?: { id: number; name: string; avatar_url?: string } | null
  }
}

export type ChatwootConversationDetail = ChatwootConversation & {
  messages: ChatwootMessage[]
}

export type ChatwootListMeta = {
  mine_count: number
  unassigned_count: number
  all_count: number
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class ChatwootClient {
  private base: string
  private token: string
  private accountId: number

  constructor(baseUrl: string, token: string, accountId: number) {
    this.base = baseUrl.replace(/\/+$/, "")
    this.token = token
    this.accountId = accountId
  }

  private async request<T>(
    path: string,
    opts: RequestInit = {},
  ): Promise<T> {
    const url = `${this.base}/api/v1/accounts/${this.accountId}${path}`
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15_000)

    try {
      const res = await fetch(url, {
        ...opts,
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          api_access_token: this.token,
          ...((opts.headers as Record<string, string>) ?? {}),
        },
      })
      if (!res.ok) {
        const body = await res.text().catch(() => "")
        throw new Error(`Chatwoot ${res.status}: ${body.slice(0, 300)}`)
      }
      return (await res.json()) as T
    } finally {
      clearTimeout(timer)
    }
  }

  // -- Profile (sem account_id) -------------------------------------------

  async testConnection(): Promise<{ id: number; name: string }> {
    const url = `${this.base}/auth/sign_in`
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10_000)
    try {
      const res = await fetch(`${this.base}/api/v1/profile`, {
        signal: ctrl.signal,
        headers: { api_access_token: this.token },
      })
      if (!res.ok) throw new Error(`Chatwoot ${res.status}`)
      const data = (await res.json()) as { id: number; name: string }
      return data
    } finally {
      clearTimeout(timer)
    }
  }

  // -- Inboxes ------------------------------------------------------------

  async listInboxes(): Promise<ChatwootInbox[]> {
    const res = await this.request<{ payload: ChatwootInbox[] }>("/inboxes")
    return res.payload
  }

  // -- Conversations ------------------------------------------------------

  async listConversations(params: {
    status?: string
    inboxId?: number
    page?: number
  } = {}): Promise<{ data: ChatwootConversation[]; meta: ChatwootListMeta }> {
    const qs = new URLSearchParams()
    if (params.status) qs.set("status", params.status)
    if (params.inboxId) qs.set("inbox_id", String(params.inboxId))
    if (params.page) qs.set("page", String(params.page))
    const q = qs.toString()
    const res = await this.request<{
      data: { payload: ChatwootConversation[] }
      meta: ChatwootListMeta
    }>(`/conversations${q ? `?${q}` : ""}`)
    return { data: res.data.payload, meta: res.meta }
  }

  async getConversation(id: number): Promise<ChatwootConversationDetail> {
    return this.request<ChatwootConversationDetail>(`/conversations/${id}`)
  }

  // -- Messages -----------------------------------------------------------

  async sendMessage(
    conversationId: number,
    content: string,
    opts: { private?: boolean } = {},
  ): Promise<ChatwootMessage> {
    return this.request<ChatwootMessage>(
      `/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          content,
          message_type: "outgoing",
          private: opts.private ?? false,
        }),
      },
    )
  }

  // -- Status toggle ------------------------------------------------------

  async toggleStatus(
    conversationId: number,
    status: "open" | "resolved" | "pending",
  ): Promise<void> {
    await this.request(`/conversations/${conversationId}/toggle_status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    })
  }

  // -- Contacts -----------------------------------------------------------

  async getContact(id: number): Promise<ChatwootContact> {
    return this.request<ChatwootContact>(`/contacts/${id}`)
  }
}
