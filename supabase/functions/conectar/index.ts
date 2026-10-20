// Edge function "conectar": a única porta que toca o segredo.
//
// Duas ações, sempre com a service key (nunca a chave chega ao front):
//  - "salvar-segredo": grava o segredo no Vault (via app_set_secret) e liga a
//     flag has_secret/has_key + secret_name na linha. O valor não volta.
//  - "testar": lê o segredo do Vault (app_get_secret) e faz uma chamada real ao
//     provedor, refletindo o resultado no status da linha. O valor não volta.
//
// Autorização: exige um usuário autenticado (app de dono único, RLS já restringe
// os dados). O segredo em si só é alcançável por esta função.

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

/** Chamada externa com timeout, para o teste não travar a tela. */
async function ping(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 10000)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (req.method !== "POST") return json({ error: "método inválido" }, 405)

  // Exige usuário autenticado.
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

  if (action === "testar") {
    const { data: row, error: re } = await admin
      .from(table)
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (re || !row) return json({ error: "registro não encontrado" }, 404)

    const secretValue =
      row[nameCol]
        ? (await admin.rpc("app_get_secret", { p_name: row[nameCol] })).data
        : null

    let status = "error"
    let message = ""

    try {
      if (kind === "model") {
        if (!secretValue) {
          message = "Configure a chave antes de testar."
        } else {
          const base = String(row.base_url).replace(/\/$/, "")
          const res = await ping(`${base}/models`, {
            headers: { Authorization: `Bearer ${secretValue}` },
          })
          status = res.ok ? "ok" : "error"
          message = res.ok ? "Modelo respondeu." : `HTTP ${res.status}`
        }
      } else {
        const type = String(row.type)
        const cfg = (row.config ?? {}) as Record<string, string>
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
        } else {
          // gmail (OAuth, Fase 2) e glpi (rede interna, Fase 3): preparados.
          status = "pending"
          message =
            type === "gmail"
              ? "OAuth do Gmail é configurado na Fase 2."
              : "GLPI é verificado na Fase 3."
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
