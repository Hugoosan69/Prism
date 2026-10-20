import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Início do OAuth do Gmail. Reaproveita o app OAuth do Google do cofre
// (drive_app_id/secret em settings) e pede o escopo do Gmail + e-mail.
//
// Segunda rota de API do projeto além de /api/chat, e por um motivo concreto:
// OAuth exige um endpoint de redirect no servidor (o code e a troca por token
// não podem viver no client). Ver CLAUDE.md.
export const dynamic = "force-dynamic"

const GMAIL_SCOPE = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ")

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id)
    return NextResponse.json({ error: "faltou o id da integração" }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin))

  const { data: settings } = await supabase
    .from("settings")
    .select("drive_app_id")
    .maybeSingle()
  const clientId = settings?.drive_app_id?.trim() || process.env.GOOGLE_CLIENT_ID
  if (!clientId)
    return NextResponse.redirect(
      new URL("/configuracoes?gmail=sem_app", req.nextUrl.origin)
    )

  const redirectUri = `${req.nextUrl.origin}/api/integrations/gmail/callback`
  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GMAIL_SCOPE,
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state: id,
    })

  return NextResponse.redirect(authUrl)
}
