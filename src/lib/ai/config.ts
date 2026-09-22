/**
 * Configuração do chat de IA. Diferente de lib/supabase/config.ts, aqui **nada**
 * tem padrão versionado: a chave da NVIDIA é paga, as do Google dão acesso ao
 * Drive, e o repositório é público. Sem a variável de ambiente o recurso se
 * desliga e a tela diz o motivo, em vez de estourar no meio de uma resposta.
 */

export const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
export const NVIDIA_MODEL = "nvidia/nemotron-3-ultra-550b-a55b"

/** Teto de turnos de ferramenta por mensagem: evita laço infinito de tool call. */
export const MAX_TOOL_ROUNDS = 6

export const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? ""
export const TAVILY_API_KEY = process.env.TAVILY_API_KEY ?? ""

/** Cofre: sempre pela API do Drive, em desenvolvimento e em produção. */
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ""
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ""
export const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN ?? ""
export const GOOGLE_VAULT_FOLDER =
  process.env.GOOGLE_VAULT_FOLDER ?? "Obsidian/SEGUNDO CÉREBRO"

export const chatEnabled = () => NVIDIA_API_KEY.length > 0
export const webSearchEnabled = () => TAVILY_API_KEY.length > 0

export const driveVaultEnabled = () =>
  GOOGLE_CLIENT_ID.length > 0 &&
  GOOGLE_CLIENT_SECRET.length > 0 &&
  GOOGLE_REFRESH_TOKEN.length > 0

export const vaultEnabled = driveVaultEnabled
