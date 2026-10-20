import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Retorno do OAuth do Gmail: troca o code por tokens, descobre o e-mail da
// conta e guarda o refresh token no Vault pela edge function `conectar` (o
// segredo nunca fica no banco em texto nem volta ao front). A integração
// recebe config.email + status connected.
export const dynamic = "force-dynamic"

function back(origin: string, result: string) {
  return NextResponse.redirect(new URL(`/configuracoes?gmail=${result}`, origin))
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const code = req.nextUrl.searchParams.get("code")
  const id = req.nextUrl.searchParams.get("state")
  const err = req.nextUrl.searchParams.get("error")
  if (err || !code || !id) return back(origin, "erro")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", origin))

  const { data: settings } = await supabase
    .from("settings")
    .select("drive_app_id, drive_app_secret")
    .maybeSingle()
  const clientId = settings?.drive_app_id?.trim() || process.env.GOOGLE_CLIENT_ID
  const clientSecret =
    settings?.drive_app_secret?.trim() || process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return back(origin, "sem_app")

  const redirectUri = `${origin}/api/integrations/gmail/callback`
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })
  const tokens = await tokenRes.json()
  if (!tokenRes.ok || !tokens.refresh_token) return back(origin, "sem_token")

  // E-mail da conta: userinfo com o access token recém-emitido.
  let email = ""
  try {
    const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (info.ok) email = (await info.json()).email ?? ""
  } catch {}

  // Guarda o refresh token no Vault via edge function (usa a sessão do dono).
  const { error: secretError } = await supabase.functions.invoke("conectar", {
    body: {
      action: "salvar-segredo",
      kind: "integration",
      id,
      secret: tokens.refresh_token,
    },
  })
  if (secretError) return back(origin, "erro")

  await supabase
    .from("integrations")
    .update({
      status: "connected",
      config: { email },
      last_sync_at: new Date().toISOString(),
    })
    .eq("id", id)

  return back(origin, "ok")
}
