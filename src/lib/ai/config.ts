/**
 * Configuração do chat de IA. Diferente de lib/supabase/config.ts, aqui **nada**
 * tem padrão versionado: a chave do modelo é paga, as do Google dão acesso ao
 * Drive, e o repositório é público. Sem a variável de ambiente o recurso se
 * desliga e a tela diz o motivo, em vez de estourar no meio de uma resposta.
 */

/**
 * Provedor do modelo, no formato da OpenAI.
 *
 * Histórico curto e útil, todo em 22/09/2026: NVIDIA (Nemotron 550B) saiu por
 * levar de 4 a 20 segundos até o primeiro token; Groq (qwen3.8-27b) entrou
 * rápido mas com o plano gratuito limitando 7.000 tokens de entrada por minuto
 * — uma pergunta que consultasse o cofre consumia a cota inteira e morria com
 * 429 depois de já ter feito o trabalho. Agora OpenAI `gpt-4.1-mini`: responde
 * em 1 a 2 segundos e permite 200.000 tokens por minuto.
 *
 * Trocar de novo é mexer nestas três constantes e na variável da chave.
 */
export const AI_BASE_URL =
  process.env.AI_BASE_URL ?? "https://api.openai.com/v1"
export const AI_MODEL = process.env.AI_MODEL ?? "gpt-4.1-mini"

/** Aceita o nome genérico ou o do provedor da vez, nesta ordem. */
export const AI_API_KEY =
  process.env.AI_API_KEY ??
  process.env.OPENAI_API_KEY ??
  process.env.GROQ_API_KEY ??
  ""

/** Teto por resposta: segura o custo de uma geração que fuja do assunto. */
export const MAX_TOKENS = 4096

/**
 * Teto de rodadas de ferramenta por mensagem. Cada rodada **reenvia tudo o que
 * veio antes**, então este número multiplica o custo da pergunta — e o custo
 * agora é dinheiro, não cota. Quatro cobre buscar, abrir e responder.
 */
export const MAX_TOOL_ROUNDS = 4

/**
 * Tetos de tamanho, em caracteres. Nasceram do limite por minuto do Groq e
 * ficaram por outro motivo: tudo que uma ferramenta devolve volta ao modelo a
 * cada rodada seguinte, e isso agora se paga por token. Aproximação usada:
 * 4 caracteres por token.
 */
export const LIMITE_RESULTADO_FERRAMENTA = 9000
export const LIMITE_TEXTO_LONGO = 1800
/** Mensagens recentes enviadas ao modelo; o resto da conversa fica só na tela. */
export const LIMITE_HISTORICO = 14

export const TAVILY_API_KEY = process.env.TAVILY_API_KEY ?? ""

/** Cofre: sempre pela API do Drive, em desenvolvimento e em produção. */
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ""
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ""
export const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN ?? ""
export const GOOGLE_VAULT_FOLDER =
  process.env.GOOGLE_VAULT_FOLDER ?? "Obsidian/SEGUNDO CÉREBRO"

export const chatEnabled = () => AI_API_KEY.length > 0
export const webSearchEnabled = () => TAVILY_API_KEY.length > 0

export const driveVaultEnabled = () =>
  GOOGLE_CLIENT_ID.length > 0 &&
  GOOGLE_CLIENT_SECRET.length > 0 &&
  GOOGLE_REFRESH_TOKEN.length > 0

export const vaultEnabled = driveVaultEnabled
