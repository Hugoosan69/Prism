import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"
import { SUPABASE_KEY, SUPABASE_URL } from "./config"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Chamado de um Server Component — o middleware renova a sessão.
        }
      },
    },
  })
}

/**
 * Cliente para quem chega com `Authorization: Bearer <token>` em vez de cookie
 * — hoje, o app Android. O navegador guarda a sessão em cookie e o aplicativo
 * guarda no armazenamento dele, então a mesma rota precisa aceitar as duas
 * formas. O token continua sendo validado pelo Supabase e o RLS segue valendo
 * igual: isto muda de onde a credencial vem, não o que ela pode fazer.
 */
export function createClientFromToken(accessToken: string) {
  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
