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
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_VAULT_FOLDER,
  TAVILY_API_KEY,
} from "./config"

export type AiSettings = {
  baseUrl: string
  model: string
  apiKey: string
  tavilyKey: string
  /** Diretriz escrita por Hugo. Vazio = só a personalidade de partida vale. */
  instructions: string
  /** Grava sem passar pelo card, quando a rodada não tocou fonte externa. */
  acaoDireta: boolean
  /** Credenciais do Drive para ler o cofre. Ver `drive` mais abaixo. */
  drive: DriveSettings
}

export type DriveSettings = {
  clientId: string
  clientSecret: string
  refreshToken: string
  folder: string
}

export const PADRAO: AiSettings = {
  baseUrl: AI_BASE_URL,
  model: AI_MODEL,
  apiKey: AI_API_KEY,
  tavilyKey: TAVILY_API_KEY,
  instructions: "",
  acaoDireta: false,
  drive: {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    refreshToken: GOOGLE_REFRESH_TOKEN,
    folder: GOOGLE_VAULT_FOLDER,
  },
}

/**
 * O cofre está ligado quando as três credenciais existem, venham do banco ou
 * do ambiente. Substituiu `vaultEnabled()` de `config.ts`, que só enxergava a
 * variável de ambiente: quando o ambiente não chegava ao processo, o cofre
 * sumia sem ter como religar pela tela.
 */
export const cofreLigado = (settings: AiSettings) =>
  settings.drive.clientId.length > 0 &&
  settings.drive.clientSecret.length > 0 &&
  settings.drive.refreshToken.length > 0

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
      // `*` e não a lista de colunas: assim uma migration ainda não aplicada
      // tira **um** campo do ar em vez de derrubar a leitura inteira. Com a
      // lista, uma coluna que falta faz o select falhar, tudo cai para a env —
      // e como as credenciais do cofre agora moram aqui, o cofre iria junto.
      .select("*")
      .maybeSingle()

    if (!data) return PADRAO

    return {
      baseUrl: data.ai_base_url?.trim() || PADRAO.baseUrl,
      model: data.ai_model?.trim() || PADRAO.model,
      apiKey: data.ai_api_key?.trim() || PADRAO.apiKey,
      tavilyKey: data.tavily_api_key?.trim() || PADRAO.tavilyKey,
      instructions: data.ai_instructions?.trim() ?? "",
      acaoDireta: data.acao_direta ?? false,
      drive: {
        clientId: data.drive_app_id?.trim() || PADRAO.drive.clientId,
        clientSecret: data.drive_app_secret?.trim() || PADRAO.drive.clientSecret,
        refreshToken: data.drive_renewal?.trim() || PADRAO.drive.refreshToken,
        folder: data.drive_folder?.trim() || PADRAO.drive.folder,
      },
    }
  } catch {
    return PADRAO
  }
}
