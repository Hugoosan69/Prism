/**
 * Autoriza o Prism a ler o cofre no Google Drive — uma vez só.
 *
 * O que ele faz: abre o consentimento do Google no navegador, recebe o código
 * de volta num servidor local e troca esse código por um refresh token. O
 * refresh token é o que vai para a Vercel; ele não expira sozinho (só se você
 * revogar o acesso ou trocar o client secret).
 *
 * Rodar com:  node scripts/drive-auth.mjs
 *
 * Antes, no Google Cloud Console → Credenciais → seu OAuth client, a URI
 * http://localhost:5173/callback precisa estar em "Authorized redirect URIs".
 * O script avisa se não estiver.
 */

import { createServer } from "node:http"
import { readFileSync } from "node:fs"
import { createInterface } from "node:readline/promises"

const PORT = 5173
const REDIRECT_URI = `http://localhost:${PORT}/callback`
const SCOPE = "https://www.googleapis.com/auth/drive.readonly"

/** Lê o .env.local sem depender de dotenv: três linhas de parser bastam. */
function readEnvLocal() {
  const env = {}
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const at = line.indexOf("=")
      if (at === -1 || line.trim().startsWith("#")) continue
      env[line.slice(0, at).trim()] = line.slice(at + 1).trim()
    }
  } catch {
    // Sem .env.local ainda: as credenciais vêm pelo prompt.
  }
  return env
}

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(question)
  rl.close()
  return answer.trim()
}

const env = readEnvLocal()
const clientId =
  process.env.GOOGLE_CLIENT_ID ||
  env.GOOGLE_CLIENT_ID ||
  (await ask("GOOGLE_CLIENT_ID: "))
const clientSecret =
  process.env.GOOGLE_CLIENT_SECRET ||
  env.GOOGLE_CLIENT_SECRET ||
  (await ask("GOOGLE_CLIENT_SECRET: "))

if (!clientId || !clientSecret) {
  console.error("Faltou o client id ou o secret.")
  process.exit(1)
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    // Sem estes dois o Google devolve só access token na segunda autorização.
    access_type: "offline",
    prompt: "consent",
  })

console.log("\nAbra este endereço no navegador e autorize:\n")
console.log(authUrl)
console.log("\nEsperando o retorno em", REDIRECT_URI, "…\n")

const code = await new Promise((resolve, reject) => {
  const server = createServer((request, response) => {
    const url = new URL(request.url, `http://localhost:${PORT}`)
    if (url.pathname !== "/callback") {
      response.writeHead(404).end()
      return
    }

    const error = url.searchParams.get("error")
    const received = url.searchParams.get("code")

    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    response.end(
      `<p style="font:16px system-ui;padding:2rem">${
        received ? "Pronto. Pode fechar esta aba." : `Falhou: ${error}`
      }</p>`
    )

    server.close()
    received ? resolve(received) : reject(new Error(error ?? "sem código"))
  })

  server.listen(PORT)
})

const response = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  }),
})

const data = await response.json()

if (!response.ok || !data.refresh_token) {
  console.error("\nNão veio refresh token:", JSON.stringify(data, null, 2))
  console.error(
    "\nSe veio só access_token, revogue o acesso em " +
      "https://myaccount.google.com/permissions e rode de novo."
  )
  process.exit(1)
}

console.log("\nPronto. Coloque no .env.local (e nas variáveis da Vercel):\n")
console.log(`GOOGLE_CLIENT_ID=${clientId}`)
console.log(`GOOGLE_CLIENT_SECRET=${clientSecret}`)
console.log(`GOOGLE_REFRESH_TOKEN=${data.refresh_token}`)
console.log(`GOOGLE_VAULT_FOLDER=Obsidian/SEGUNDO CÉREBRO`)
