import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Uma chave colada pela metade chega ao Supabase como "Invalid API key", erro
 * que não diz onde está o problema. Conferir o formato aqui aponta direto para
 * a variável de ambiente errada.
 */
function assertConfig() {
  if (!url || !key) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
  }
  if (!key.startsWith("sb_publishable_") && !key.startsWith("ey")) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_ANON_KEY parece incompleta (começa com "${key.slice(0, 6)}"). Esperado "sb_publishable_..." — confira se o valor foi colado inteiro.`
    )
  }
}

export function createClient() {
  assertConfig()
  return createBrowserClient<Database>(url!, key!)
}
