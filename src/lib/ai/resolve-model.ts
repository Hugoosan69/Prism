/**
 * Resolução do modelo por superfície (chat / gmail / chamados).
 *
 * A atribuição (`ai_assignments`) aponta para um modelo (`ai_models`). Sem
 * atribuição, sem modelo, ou com o modelo incompleto, cai no padrão de fábrica
 * (settings/env) — o mesmo princípio de `lib/ai/settings.ts`: o banco vence, a
 * env é o padrão, e o chat continua de pé mesmo com os cadastros vazios.
 *
 * A decisão pura (`escolherModelo`) é separada do acesso ao banco para poder
 * ser testada sem Supabase.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import type { AiModel, AiSurface } from "@/lib/types"
import { PADRAO, type AiSettings } from "./settings"

export type ResolvedModel = {
  baseUrl: string
  model: string
  dialect: string
  /** Nome do segredo no Vault; null quando caiu no padrão (chave da env/settings). */
  keySecretName: string | null
  /** true quando veio de um cadastro; false quando é o padrão de fábrica. */
  fromAssignment: boolean
}

/** Padrão de fábrica a partir das settings. */
function padrao(fallback: AiSettings): ResolvedModel {
  return {
    baseUrl: fallback.baseUrl,
    model: fallback.model,
    dialect: "openai",
    keySecretName: null,
    fromAssignment: false,
  }
}

/**
 * Decisão pura: dado o modelo atribuído (ou null) e o padrão, escolhe. Um
 * modelo sem `base_url` ou sem `model` é tratado como ausente — melhor cair no
 * padrão que montar uma chamada quebrada.
 */
export function escolherModelo(
  model: Pick<
    AiModel,
    "base_url" | "model" | "dialect" | "key_secret_name" | "has_key"
  > | null,
  fallback: AiSettings
): ResolvedModel {
  if (model && model.base_url?.trim() && model.model?.trim()) {
    return {
      baseUrl: model.base_url.trim(),
      model: model.model.trim(),
      dialect: model.dialect?.trim() || "openai",
      keySecretName: model.has_key ? model.key_secret_name : null,
      fromAssignment: true,
    }
  }
  return padrao(fallback)
}

/**
 * Lê a atribuição da superfície e resolve o modelo. Falha em silêncio para o
 * padrão (tabela ausente, erro de leitura), como `carregarSettings`.
 */
export async function resolverModelo(
  supabase: SupabaseClient<Database>,
  surface: AiSurface,
  fallback: AiSettings = PADRAO
): Promise<ResolvedModel> {
  try {
    const { data } = await supabase
      .from("ai_assignments")
      .select(
        "model:ai_models(base_url, model, dialect, key_secret_name, has_key)"
      )
      .eq("surface", surface)
      .maybeSingle()

    const model = (data?.model ?? null) as Parameters<typeof escolherModelo>[0]
    return escolherModelo(model, fallback)
  } catch {
    return padrao(fallback)
  }
}
