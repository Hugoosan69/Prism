/**
 * Configuração do Supabase, num lugar só.
 *
 * URL e chave publicável são públicas por definição: o Next embute as duas no
 * bundle que vai para o navegador, e quem protege os dados é o RLS, não o
 * segredo da chave. Por isso ficam versionadas como padrão — assim o app sobe
 * funcionando mesmo que a variável de ambiente não exista.
 *
 * A variável de ambiente continua tendo prioridade (para apontar para outro
 * projeto), mas só quando tem formato válido: uma chave colada pela metade
 * chega ao Supabase como "Invalid API key", erro que não diz onde está o
 * problema e derruba login e middleware ao mesmo tempo.
 */

const DEFAULT_URL = "https://ukewaugpbrorabmeptip.supabase.co"
const DEFAULT_KEY = "sb_publishable_OeNJwCKAzy2Dbb0pDZe0bA_FLNeYQYj"

/** Formato novo (sb_publishable_) ou chave legada em JWT (ey...) */
function keyLooksValid(key: string) {
  return key.startsWith("sb_publishable_") || key.startsWith("ey")
}

function urlLooksValid(url: string) {
  return url.startsWith("https://") && url.includes(".supabase.")
}

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const SUPABASE_URL =
  envUrl && urlLooksValid(envUrl) ? envUrl : DEFAULT_URL
export const SUPABASE_KEY =
  envKey && keyLooksValid(envKey) ? envKey : DEFAULT_KEY

/** Avisa quando a variável existe mas está malformada, em vez de falhar mudo. */
export function warnIfMisconfigured() {
  if (envKey && !keyLooksValid(envKey)) {
    console.warn(
      `[Prism] NEXT_PUBLIC_SUPABASE_ANON_KEY está malformada (começa com "${envKey.slice(0, 6)}"). ` +
        `Esperado "sb_publishable_...". Usando o valor padrão do projeto.`
    )
  }
  if (envUrl && !urlLooksValid(envUrl)) {
    console.warn(
      `[Prism] NEXT_PUBLIC_SUPABASE_URL inválida ("${envUrl}"). Usando o valor padrão do projeto.`
    )
  }
}
