import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"
import { SUPABASE_KEY, SUPABASE_URL, warnIfMisconfigured } from "./config"

export function createClient() {
  warnIfMisconfigured()
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_KEY)
}
