// Edge function "conectar": a única porta que toca o segredo.
//  - "salvar-segredo": grava o segredo no Vault (app_set_secret) e liga has_*.
//  - "testar": lê o segredo (app_get_secret) e faz chamada real ao provedor.
//  - "waha-qr": garante a sessão WAHA própria do Prism e devolve o QR (data URL).
//  - "waha-status": lê o estado da sessão WAHA e reflete no status da integração.
// O valor do segredo nunca volta ao front. Exige usuário autenticado (dono único + RLS).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!

async function ping(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 12000)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

/** Nome da sessão WAHA do Prism (própria — nunca a do agente n8n). */
function wahaSession(cfg: Record<string, string>) {
  return cfg.session?.trim() || "prism"
}

/** Garante que a sessão exista e esteja iniciada. Tenta o REST atual e cai no antigo. */
async function ensureWahaSession(base: string, session: string, key: string) {
  const headers = { "X-Api-Key": key, "Content-Type": "application/json" }
  // WAHA atual: cria+inicia num POST só (idempotente na prática; 4xx se já existe).
  const novo = await ping(`${base}/api/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: session, start: true }),
  }).catch(() => null)
  if (novo && (novo.ok || novo.status === 422 || novo.status === 409)) return
  // WAHA antigo: inicia por outro caminho.
  await ping(`${base}/api/sessions/start`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: session }),
  }).catch(() => null)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (req.method !== "POST") return json({ error: "método inválido" }, 405)

  const authHeader = req.headers.get("Authorization") ?? ""
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) return json({ error: "não autenticado" }, 401)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  let body: {
    action?: string
    kind?: "integration" | "model"
    id?: string
    secret?: string
    chatId?: string
    text?: string
    limit?: number
    conversationId?: number
    status?: string
    inboxId?: number
    page?: number
    private?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: "corpo inválido" }, 400)
  }

  const { action, kind, id, secret } = body
  if (!action || !kind || !id) return json({ error: "faltam campos" }, 400)

  const table = kind === "integration" ? "integrations" : "ai_models"
  const flag = kind === "integration" ? "has_secret" : "has_key"
  const nameCol = kind === "integration" ? "secret_name" : "key_secret_name"
  const secretName = `${kind}_${id}`

  if (action === "salvar-segredo") {
    if (!secret) return json({ error: "segredo vazio" }, 400)
    const { error: se } = await admin.rpc("app_set_secret", {
      p_name: secretName,
      p_secret: secret,
    })
    if (se) return json({ error: `vault: ${se.message}` }, 500)
    const { error: ue } = await admin
      .from(table)
      .update({ [flag]: true, [nameCol]: secretName })
      .eq("id", id)
    if (ue) return json({ error: ue.message }, 500)
    return json({ ok: true })
  }

  // Ações do WhatsApp/WAHA: precisam da linha de integração + URL + chave.
  async function loadIntegration() {
    const { data } = await admin
      .from("integrations")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    return data
  }

  if (action === "waha-qr" || action === "waha-status") {
    const row = await loadIntegration()
    if (!row) return json({ error: "integração não encontrada" }, 404)
    const cfg = (row.config ?? {}) as Record<string, string>
    const base = (cfg.url ?? "").replace(/\/$/, "")
    const key = row.secret_name
      ? ((await admin.rpc("app_get_secret", { p_name: row.secret_name })).data ??
        "")
      : ""
    if (!base || !key)
      return json({ error: "Informe a URL do WAHA e a API key antes." }, 400)

    const session = wahaSession(cfg)
    const headers = { "X-Api-Key": key }

    if (action === "waha-qr") {
      await ensureWahaSession(base, session, key)
      // Caminho de QR comum às versões; devolve imagem ou JSON {mimetype,data}.
      const res = await ping(
        `${base}/api/${session}/auth/qr?format=image`,
        { headers }
      ).catch(() => null)
      if (!res || !res.ok) {
        // Pode já estar conectado (sem QR) — confere o status.
        const st = await ping(`${base}/api/sessions/${session}`, {
          headers,
        }).catch(() => null)
        const waStatus = st && st.ok ? (await st.json()).status : null
        if (waStatus === "WORKING") {
          await admin
            .from("integrations")
            .update({ status: "connected", last_sync_at: new Date().toISOString() })
            .eq("id", id)
          return json({ status: "connected", message: "Já conectado." })
        }
        return json(
          { error: `WAHA não devolveu o QR (HTTP ${res?.status ?? "s/resposta"}).` },
          502
        )
      }
      const ct = res.headers.get("content-type") ?? ""
      let dataUrl: string
      if (ct.includes("application/json")) {
        const j = await res.json()
        const mime = j.mimetype ?? "image/png"
        dataUrl = `data:${mime};base64,${j.data ?? j.qr ?? ""}`
      } else {
        const buf = new Uint8Array(await res.arrayBuffer())
        let bin = ""
        for (const b of buf) bin += String.fromCharCode(b)
        dataUrl = `data:${ct || "image/png"};base64,${btoa(bin)}`
      }
      await admin.from("integrations").update({ status: "pending" }).eq("id", id)
      return json({ qr: dataUrl, status: "pending" })
    }

    // waha-status
    const st = await ping(`${base}/api/sessions/${session}`, { headers }).catch(
      () => null
    )
    if (!st || !st.ok)
      return json({ error: `WAHA HTTP ${st?.status ?? "s/resposta"}` }, 502)
    const waStatus = (await st.json()).status as string
    const status = waStatus === "WORKING" ? "connected" : "pending"
    await admin
      .from("integrations")
      .update({
        status,
        ...(status === "connected"
          ? { last_sync_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", id)
    return json({ status, waStatus })
  }

  // Leitura e resposta de conversas do WhatsApp, direto do WAHA (sem webhook
  // ainda): lista de chats, mensagens de um chat e envio de texto.
  if (
    action === "waha-chats" ||
    action === "waha-messages" ||
    action === "waha-send"
  ) {
    const row = await loadIntegration()
    if (!row) return json({ error: "integração não encontrada" }, 404)
    const cfg = (row.config ?? {}) as Record<string, string>
    const base = (cfg.url ?? "").replace(/\/$/, "")
    const key = row.secret_name
      ? ((await admin.rpc("app_get_secret", { p_name: row.secret_name })).data ??
        "")
      : ""
    if (!base || !key)
      return json({ error: "Informe a URL do WAHA e a API key antes." }, 400)
    const session = wahaSession(cfg)
    const headers = { "X-Api-Key": key, "Content-Type": "application/json" }
    const limit = body.limit ?? 30

    try {
      if (action === "waha-chats") {
        // Overview traz nome + última mensagem; cai para /chats se não existir.
        let res = await ping(
          `${base}/api/${session}/chats/overview?limit=${limit}`,
          { headers }
        )
        if (!res.ok)
          res = await ping(`${base}/api/${session}/chats?limit=${limit}`, {
            headers,
          })
        if (!res.ok) return json({ error: `WAHA HTTP ${res.status}` }, 502)
        return json({ chats: await res.json() })
      }

      if (action === "waha-messages") {
        if (!body.chatId) return json({ error: "faltou o chatId" }, 400)
        const res = await ping(
          `${base}/api/${session}/chats/${encodeURIComponent(
            body.chatId
          )}/messages?limit=${body.limit ?? 50}&downloadMedia=false`,
          { headers }
        )
        if (!res.ok) return json({ error: `WAHA HTTP ${res.status}` }, 502)
        return json({ messages: await res.json() })
      }

      // waha-send
      if (!body.chatId || !body.text?.trim())
        return json({ error: "faltou chatId ou texto" }, 400)
      const res = await ping(`${base}/api/sendText`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session,
          chatId: body.chatId,
          text: body.text,
        }),
      })
      if (!res.ok) return json({ error: `WAHA HTTP ${res.status}` }, 502)
      return json({ ok: true, message: await res.json() })
    } catch (e) {
      return json(
        { error: e instanceof Error ? e.message : "falha WAHA" },
        502
      )
    }
  }

  // ---------------------------------------------------------------------------
  // Chatwoot: proxy para a API v1
  // ---------------------------------------------------------------------------
  if (action.startsWith("chatwoot-")) {
    const row = await loadIntegration()
    if (!row) return json({ error: "integração não encontrada" }, 404)
    const cfg = (row.config ?? {}) as Record<string, string>
    const cwBase = (cfg.url ?? "").replace(/\/+$/, "")
    const accountId = cfg.account_id ?? ""
    const token = row.secret_name
      ? ((await admin.rpc("app_get_secret", { p_name: row.secret_name })).data ?? "")
      : ""
    if (!cwBase || !token)
      return json({ error: "Informe a URL do Chatwoot e salve o token antes." }, 400)
    if (!accountId)
      return json({ error: "Informe o Account ID nas configurações." }, 400)

    const cwHeaders = {
      "Content-Type": "application/json",
      api_access_token: token,
    }
    const apiBase = `${cwBase}/api/v1/accounts/${accountId}`

    try {
      if (action === "chatwoot-test") {
        const res = await ping(`${cwBase}/api/v1/profile`, {
          headers: cwHeaders,
        })
        if (!res.ok) return json({ error: `Chatwoot HTTP ${res.status}` }, 502)
        const profile = await res.json()
        await admin
          .from("integrations")
          .update({
            status: "connected",
            last_sync_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", id)
        return json({ status: "connected", profile })
      }

      if (action === "chatwoot-inboxes") {
        const res = await ping(`${apiBase}/inboxes`, { headers: cwHeaders })
        if (!res.ok) return json({ error: `Chatwoot HTTP ${res.status}` }, 502)
        const data = await res.json()
        return json({ inboxes: data.payload ?? data })
      }

      if (action === "chatwoot-conversations") {
        const qs = new URLSearchParams()
        if (body.status) qs.set("status", body.status as string)
        if (body.inboxId) qs.set("inbox_id", String(body.inboxId))
        if (body.page) qs.set("page", String(body.page))
        const q = qs.toString()
        const res = await ping(
          `${apiBase}/conversations${q ? `?${q}` : ""}`,
          { headers: cwHeaders }
        )
        if (!res.ok) return json({ error: `Chatwoot HTTP ${res.status}` }, 502)
        return json(await res.json())
      }

      if (action === "chatwoot-conversation") {
        if (!body.conversationId)
          return json({ error: "faltou conversationId" }, 400)
        const res = await ping(
          `${apiBase}/conversations/${body.conversationId}`,
          { headers: cwHeaders }
        )
        if (!res.ok) return json({ error: `Chatwoot HTTP ${res.status}` }, 502)
        return json(await res.json())
      }

      if (action === "chatwoot-send") {
        if (!body.conversationId || !body.text?.trim())
          return json({ error: "faltou conversationId ou texto" }, 400)
        const res = await ping(
          `${apiBase}/conversations/${body.conversationId}/messages`,
          {
            method: "POST",
            headers: cwHeaders,
            body: JSON.stringify({
              content: body.text,
              message_type: "outgoing",
              private: body.private ?? false,
            }),
          }
        )
        if (!res.ok) return json({ error: `Chatwoot HTTP ${res.status}` }, 502)
        return json(await res.json())
      }

      if (action === "chatwoot-toggle-status") {
        if (!body.conversationId || !body.status)
          return json({ error: "faltou conversationId ou status" }, 400)
        const res = await ping(
          `${apiBase}/conversations/${body.conversationId}/toggle_status`,
          {
            method: "POST",
            headers: cwHeaders,
            body: JSON.stringify({ status: body.status }),
          }
        )
        if (!res.ok) return json({ error: `Chatwoot HTTP ${res.status}` }, 502)
        return json(await res.json())
      }

      return json({ error: `ação chatwoot desconhecida: ${action}` }, 400)
    } catch (e) {
      return json(
        { error: e instanceof Error ? e.message : "falha Chatwoot" },
        502
      )
    }
  }

  if (action === "testar") {
    const row = await loadIntegration()
    const modelRow =
      kind === "model"
        ? (
            await admin.from("ai_models").select("*").eq("id", id).maybeSingle()
          ).data
        : null
    const target = kind === "model" ? modelRow : row
    if (!target) return json({ error: "registro não encontrado" }, 404)

    const secretValue = target[nameCol]
      ? (await admin.rpc("app_get_secret", { p_name: target[nameCol] })).data
      : null

    let status = "error"
    let message = ""

    try {
      if (kind === "model") {
        if (!secretValue) {
          message = "Configure a chave antes de testar."
        } else {
          const base = String(target.base_url).replace(/\/$/, "")
          const res = await ping(`${base}/models`, {
            headers: { Authorization: `Bearer ${secretValue}` },
          })
          status = res.ok ? "ok" : "error"
          message = res.ok ? "Modelo respondeu." : `HTTP ${res.status}`
        }
      } else {
        const type = String(target.type)
        const cfg = (target.config ?? {}) as Record<string, string>
        if (type === "waha") {
          if (!cfg.url || !secretValue) {
            status = "pending"
            message = "Informe URL e API key da sessão WAHA."
          } else {
            const res = await ping(
              `${cfg.url.replace(/\/$/, "")}/api/sessions`,
              { headers: { "X-Api-Key": secretValue } }
            )
            status = res.ok ? "connected" : "error"
            message = res.ok ? "WAHA respondeu." : `HTTP ${res.status}`
          }
        } else if (type === "gmail") {
          status = cfg.email ? "connected" : "pending"
          message = cfg.email
            ? `Conta ${cfg.email} conectada.`
            : "Clique em Conectar Gmail."
        } else if (type === "chatwoot") {
          if (!cfg.url || !cfg.account_id || !secretValue) {
            status = "pending"
            message = "Informe URL, Account ID e salve o token."
          } else {
            const res = await ping(
              `${cfg.url.replace(/\/$/, "")}/api/v1/profile`,
              { headers: { api_access_token: secretValue } }
            )
            status = res.ok ? "connected" : "error"
            message = res.ok ? "Chatwoot respondeu." : `HTTP ${res.status}`
          }
        } else {
          status = "pending"
          message = "GLPI é verificado na Fase 3."
        }
      }
    } catch (e) {
      status = "error"
      message = e instanceof Error ? e.message : "falha na chamada"
    }

    await admin
      .from(table)
      .update({
        status,
        last_error: status === "error" ? message : null,
        ...(kind === "integration" && status === "connected"
          ? { last_sync_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", id)

    return json({ status, message })
  }

  return json({ error: "ação desconhecida" }, 400)
})
