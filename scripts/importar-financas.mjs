/**
 * Carrega a planilha "Controle Financeiro" no módulo Finanças.
 *
 * Roda uma vez. Não vira rotina: a planilha deixa de existir depois disto.
 *
 *   node scripts/importar-financas.mjs
 *
 * Os valores ficam em `scripts/financas.local.json`, que **não** vai para o
 * git — o repositório é público e isto é dado financeiro real. Há um
 * `financas.exemplo.json` versionado mostrando o formato.
 *
 * Precisa de uma sessão: o RLS só deixa o dono escrever. O script pede
 * e-mail e senha (ou lê PRISM_EMAIL / PRISM_SENHA do ambiente) e autentica
 * como ele — nenhuma chave de serviço é usada, porque uma chave dessas
 * contornaria o RLS e não deve existir fora do servidor.
 *
 * É idempotente pela descrição: rodar duas vezes não duplica nada.
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"

const URL_PADRAO = "https://asdjbedpqowzdppboxyy.supabase.co"
const CHAVE_PADRAO = "sb_publishable_-HHHeglSbJkf2qSzLltnLA_woa7wDyk"

const dados = JSON.parse(
  readFileSync(new URL("./financas.local.json", import.meta.url), "utf8")
)

async function perguntar(rotulo, env) {
  if (process.env[env]) return process.env[env]
  const rl = createInterface({ input: stdin, output: stdout })
  const resposta = await rl.question(rotulo)
  rl.close()
  return resposta.trim()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? URL_PADRAO,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? CHAVE_PADRAO
)

const email = await perguntar("E-mail do Prism: ", "PRISM_EMAIL")
const password = await perguntar("Senha: ", "PRISM_SENHA")

const { error: erroLogin } = await supabase.auth.signInWithPassword({
  email,
  password,
})
if (erroLogin) {
  console.error("Login recusado:", erroLogin.message)
  process.exit(1)
}

// ---------- despesas ----------
const { data: existentes, error: erroLer } = await supabase
  .from("expenses")
  .select("id, description")
if (erroLer) {
  console.error("Não deu para ler as despesas:", erroLer.message)
  process.exit(1)
}

const porDescricao = new Map(
  existentes.map((e) => [e.description.toLowerCase(), e.id])
)

let criadas = 0
for (const despesa of dados.despesas) {
  if (porDescricao.has(despesa.descricao.toLowerCase())) continue

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      description: despesa.descricao,
      amount: despesa.valor,
      // Tudo entra como mensal/fixa, conforme combinado: Hugo ajusta o que
      // for parcelado pela tela, onde ele vê o mês e o valor lado a lado.
      kind: despesa.tipo ?? "fixa",
      recurrence: despesa.recorrencia ?? "mensal",
      start_month: despesa.inicio ?? dados.inicio,
    })
    .select("id, description")
    .single()

  if (error) {
    console.error(`  ! ${despesa.descricao}: ${error.message}`)
    continue
  }
  porDescricao.set(data.description.toLowerCase(), data.id)
  criadas++
}

// ---------- pagamentos ----------
// upsert com ignoreDuplicates: o unique (expense_id, month) é quem garante a
// idempotência, então rodar de novo não precisa de nenhuma checagem aqui.
const pagamentos = []
for (const despesa of dados.despesas) {
  const id = porDescricao.get(despesa.descricao.toLowerCase())
  if (!id) continue
  for (const mes of despesa.pagos ?? dados.mesesPagos) {
    pagamentos.push({
      expense_id: id,
      month: `${mes}-01`,
      amount_paid: despesa.valor,
    })
  }
}

const { error: erroPagar } = await supabase
  .from("expense_payments")
  .upsert(pagamentos, { onConflict: "expense_id,month", ignoreDuplicates: true })
if (erroPagar) console.error("Pagamentos:", erroPagar.message)

// ---------- proventos ----------
const { data: proventosExistentes } = await supabase
  .from("incomes")
  .select("description")
const jaTem = new Set(
  (proventosExistentes ?? []).map((i) => i.description.toLowerCase())
)

const novosProventos = dados.proventos
  .filter((p) => !jaTem.has(p.descricao.toLowerCase()))
  .map((p) => ({
    description: p.descricao,
    amount: p.valor,
    month: `${p.mes ?? dados.inicio.slice(0, 7)}-01`,
    recurring: p.recorrente ?? false,
  }))

if (novosProventos.length > 0) {
  const { error } = await supabase.from("incomes").insert(novosProventos)
  if (error) console.error("Proventos:", error.message)
}

console.log(
  `Pronto: ${criadas} despesas, ${pagamentos.length} pagamentos, ${novosProventos.length} proventos.`
)
