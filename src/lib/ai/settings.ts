/**
 * Configuração efetiva do chat: o que está no banco vence, o que falta cai
 * para a variável de ambiente.
 *
 * A env vira o padrão de fábrica. Isso mantém a promessa de `config.ts` — o app
 * sobe funcionando sem nenhuma configuração — e ainda permite trocar de modelo
 * pela tela, sem commit nem deploy.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import {
  AI_API_KEY,
  AI_BASE_URL,
  AI_MODEL,
  TAVILY_API_KEY,
} from "./config"

export type AiSettings = {
  baseUrl: string
  model: string
  apiKey: string
  tavilyKey: string
  /** Diretriz escrita por Hugo. Vazio = só a personalidade de partida vale. */
  instructions: string
}

export const PADRAO: AiSettings = {
  baseUrl: AI_BASE_URL,
  model: AI_MODEL,
  apiKey: AI_API_KEY,
  tavilyKey: TAVILY_API_KEY,
  instructions: "",
}

/**
 * Lê a configuração aplicável.
 *
 * Falha em silêncio de propósito: se a tabela não existir ainda (migration não
 * aplicada) ou a leitura der erro, o chat continua com o que está na env em vez
 * de morrer — é o mesmo princípio de `lib/supabase/config.ts`.
 */
export async function carregarSettings(
  supabase: SupabaseClient<Database>
): Promise<AiSettings> {
  try {
    const { data } = await supabase
      .from("settings")
      .select("ai_base_url, ai_model, ai_api_key, tavily_api_key, ai_instructions")
      .maybeSingle()

    if (!data) return PADRAO

    return {
      baseUrl: data.ai_base_url?.trim() || PADRAO.baseUrl,
      model: data.ai_model?.trim() || PADRAO.model,
      apiKey: data.ai_api_key?.trim() || PADRAO.apiKey,
      tavilyKey: data.tavily_api_key?.trim() || PADRAO.tavilyKey,
      instructions: data.ai_instructions?.trim() ?? "",
    }
  } catch {
    return PADRAO
  }
}
