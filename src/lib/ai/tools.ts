/**
 * Ferramentas que o modelo pode chamar.
 *
 * Duas naturezas, e a diferença é deliberada:
 *
 * - **Leitura** roda no servidor, dentro do laço da rota, e o resultado volta
 *   para o modelo na mesma resposta.
 * - **Escrita não roda aqui.** O modelo só consegue *propor* uma criação; a
 *   proposta sobe para a tela, Hugo confirma, e o próprio client grava pelo
 *   supabase-js — o mesmo caminho de mutação do resto do Prism. Nada entra no
 *   banco porque o modelo decidiu sozinho, e nenhuma instrução escondida numa
 *   nota do cofre ou numa página da web consegue gravar nada.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import type { ToolSchema } from "./client"
import {
  LIMITE_RESULTADO_FERRAMENTA,
  LIMITE_TEXTO_LONGO,
  TAVILY_API_KEY,
  vaultEnabled,
  webSearchEnabled,
} from "./config"
import { getVault } from "@/lib/vault"

const READ_TOOLS: ToolSchema[] = [
  {
    type: "function",
    function: {
      name: "buscar_no_prism",
      description:
        "Busca no conteúdo do próprio Prism: consultas SQL salvas, notas, tarefas do Kanban e links. Use sempre que a pergunta puder ser respondida pelo que Hugo já guardou.",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: ["snippets", "notas", "tarefas", "links", "tudo"],
            description:
              "snippets = biblioteca de SQL; tudo = procura em todos os módulos",
          },
          termo: {
            type: "string",
            description:
              "Texto a procurar. Deixe vazio para listar sem filtrar — é o que você quer em perguntas como 'o que está pendente?'.",
          },
          status: {
            type: "string",
            enum: ["todo", "doing", "waiting", "done", "pendentes"],
            description:
              "Só para tarefas. 'pendentes' = todo + doing, o que depende do Hugo agora. 'waiting' = esperando terceiros.",
          },
          limite: { type: "integer", description: "Padrão 10, máximo 30." },
        },
        required: ["tipo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ler_item_do_prism",
      description:
        "Lê um item inteiro do Prism pelo id, quando a busca devolveu só um resumo e você precisa do conteúdo completo.",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: ["snippets", "notas", "tarefas", "links"],
          },
          id: { type: "string" },
        },
        required: ["tipo", "id"],
      },
    },
  },
]

const VAULT_TOOLS: ToolSchema[] = [
  {
    type: "function",
    function: {
      name: "cofre_indices",
      description:
        "Lê os arquivos _INDICE-*.md do Segundo Cérebro (o cofre Obsidian de Hugo). É o ponto de partida obrigatório: os índices dizem quais notas existem e do que tratam. Nunca varra o cofre inteiro antes de olhar aqui.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "cofre_buscar",
      description:
        "Procura um termo no conteúdo e no nome das notas do cofre, devolvendo o caminho e um trecho de cada ocorrência.",
      parameters: {
        type: "object",
        properties: {
          termo: { type: "string" },
          limite: { type: "integer", description: "Padrão 12." },
        },
        required: ["termo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cofre_ler",
      description:
        "Lê uma nota do cofre pelo caminho relativo, como aparece nos índices ou na busca (ex.: 02-Decisoes/Monolito-modular-em-vez-de-microservicos.md).",
      parameters: {
        type: "object",
        properties: { caminho: { type: "string" } },
        required: ["caminho"],
      },
    },
  },
]

const WEB_TOOLS: ToolSchema[] = [
  {
    type: "function",
    function: {
      name: "buscar_na_web",
      description:
        "Busca na web. Use para o que é externo e atual: documentação, erro específico, versão de biblioteca, notícia. Não use para o que já está no Prism ou no cofre.",
      parameters: {
        type: "object",
        properties: {
          consulta: { type: "string" },
          limite: { type: "integer", description: "Padrão 5, máximo 10." },
        },
        required: ["consulta"],
      },
    },
  },
]

/** Cada uma vira um card de confirmação na tela; ver o comentário do topo. */
const WRITE_TOOLS: ToolSchema[] = [
  {
    type: "function",
    function: {
      name: "propor_tarefa",
      description:
        "Propõe criar uma tarefa no Kanban. A tarefa NÃO é criada por esta chamada: ela aparece como proposta para Hugo confirmar.",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          descricao: { type: "string" },
          status: {
            type: "string",
            enum: ["todo", "doing", "waiting", "done"],
            description: "Padrão todo.",
          },
          prioridade: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Padrão medium.",
          },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["titulo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propor_nota",
      description:
        "Propõe criar uma nota em Markdown. A nota NÃO é criada por esta chamada: vira uma proposta para Hugo confirmar.",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          conteudo: { type: "string", description: "Markdown puro." },
        },
        required: ["titulo", "conteudo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propor_snippet",
      description:
        "Propõe salvar uma consulta na biblioteca de SQL. NÃO salva: vira uma proposta para Hugo confirmar.",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          codigo: { type: "string" },
          descricao: { type: "string" },
          categoria: {
            type: "string",
            description:
              "Categorias em uso: Faturamento, WMS, Utilitário, Venda, Estoque, Cadastro, Controle, PAP, Vendas, Fusion.",
          },
        },
        required: ["titulo", "codigo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propor_link",
      description:
        "Propõe salvar um link. NÃO salva: vira uma proposta para Hugo confirmar.",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          url: { type: "string" },
          descricao: { type: "string" },
        },
        required: ["titulo", "url"],
      },
    },
  },
]

export const WRITE_TOOL_NAMES = new Set(
  WRITE_TOOLS.map((t) => t.function.name)
)

export function availableTools(): ToolSchema[] {
  return [
    ...READ_TOOLS,
    ...(vaultEnabled() ? VAULT_TOOLS : []),
    ...(webSearchEnabled() ? WEB_TOOLS : []),
    ...WRITE_TOOLS,
  ]
}

const TABLE: Record<string, "snippets" | "notes" | "tasks" | "links"> = {
  snippets: "snippets",
  notas: "notes",
  tarefas: "tasks",
  links: "links",
}

/**
 * Colunas em que cada módulo é procurado. As consultas abaixo são escritas uma
 * a uma, com o nome da tabela literal: `from(variável)` faz a tipagem gerada do
 * supabase-js colapsar para never e o build passa a reclamar do select.
 */
const SEARCHABLE: Record<string, string[]> = {
  snippets: ["title", "description", "category", "code"],
  notes: ["title", "content"],
  tasks: ["title", "description"],
  links: ["title", "url", "description"],
}

type Supabase = SupabaseClient<Database>
type ModuleTable = "snippets" | "notes" | "tasks" | "links"

function orFilter(table: ModuleTable, termo: string) {
  return SEARCHABLE[table].map((c) => `${c}.ilike.%${termo}%`).join(",")
}

async function searchTable(
  supabase: Supabase,
  table: ModuleTable,
  termo: string,
  limite: number,
  status?: string
) {
  const or = termo ? orFilter(table, termo) : null
  // "pendentes" não é um status do banco: é o par que depende de Hugo agora.
  const estados =
    status === "pendentes" ? ["todo", "doing"] : status ? [status] : null

  const run = async () => {
    switch (table) {
      case "snippets": {
        const q = supabase
          .from("snippets")
          .select("id, title, description, category, code")
          .limit(limite)
        return or ? await q.or(or) : await q
      }
      case "notes": {
        const q = supabase
          .from("notes")
          .select("id, title, content")
          .limit(limite)
        return or ? await q.or(or) : await q
      }
      case "tasks": {
        let q = supabase
          .from("tasks")
          .select("id, title, description, status, priority, tags, due_date")
          .order("position", { ascending: true })
          .limit(limite)
        if (estados) q = q.in("status", estados)
        return or ? await q.or(or) : await q
      }
      case "links": {
        const q = supabase
          .from("links")
          .select("id, title, url, description")
          .limit(limite)
        return or ? await q.or(or) : await q
      }
    }
  }

  const { data, error } = await run()
  if (error) return { erro: error.message }
  return { modulo: table, itens: data ?? [] }
}

async function readItem(supabase: Supabase, table: ModuleTable, id: string) {
  switch (table) {
    case "snippets":
      return await supabase.from("snippets").select("*").eq("id", id).maybeSingle()
    case "notes":
      return await supabase.from("notes").select("*").eq("id", id).maybeSingle()
    case "tasks":
      return await supabase.from("tasks").select("*").eq("id", id).maybeSingle()
    case "links":
      return await supabase.from("links").select("*").eq("id", id).maybeSingle()
  }
}

async function webSearch(consulta: string, limite: number) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query: consulta,
      max_results: limite,
      search_depth: "basic",
      include_answer: true,
    }),
  })

  if (!response.ok) {
    return { erro: `Busca falhou com status ${response.status}` }
  }

  const data = (await response.json()) as {
    answer?: string
    results?: { title: string; url: string; content: string }[]
  }

  return {
    resumo: data.answer ?? "",
    resultados: (data.results ?? []).map((r) => ({
      titulo: r.title,
      url: r.url,
      trecho: r.content?.slice(0, 700) ?? "",
    })),
  }
}

/** Corta texto longo preservando o começo, que é onde mora o assunto. */
function cortar(texto: string, teto = LIMITE_TEXTO_LONGO) {
  return texto.length > teto ? `${texto.slice(0, teto)}\n[...]` : texto
}

/**
 * Compacta um índice do cofre para as linhas que importam.
 *
 * Os `_INDICE-*.md` são tabelas de "nota | resumo | projetos | data" cercadas
 * de frontmatter, títulos e comentários. Mandar os oito inteiros custava mais
 * de 8 mil tokens — sozinho acima do limite de entrada do plano. O que o modelo
 * precisa para decidir qual nota abrir são as linhas da tabela.
 */
function compactarIndice(conteudo: string) {
  const linhas = conteudo
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.startsWith("|") &&
        !l.startsWith("|---") &&
        !/^\|\s*Nota\s*\|/i.test(l)
    )
    // Só nome e resumo: as colunas de projeto e data da tabela não ajudam a
    // decidir qual nota abrir, e somadas custam um terço do orçamento.
    .map((l) => {
      const celulas = l.split("|").map((c) => c.trim()).filter(Boolean)
      const nome = (celulas[0] ?? "").replace(/\[\[|\]\]/g, "")
      const resumo = celulas[1] ?? ""
      return resumo ? `${nome} — ${resumo}` : nome
    })

  if (linhas.length === 0) {
    // Índice sem tabela (o mestre tem listas): manda o corpo cortado.
    return cortar(
      conteudo
        .split("\n")
        .filter((l) => !l.startsWith("<!--") && l.trim())
        .join("\n"),
      1200
    )
  }
  return linhas.join("\n")
}

/**
 * Executa uma ferramenta de leitura e devolve o que volta para o modelo.
 *
 * O retorno é sempre JSON serializável, e **sempre** um objeto: um erro vira
 * `{ erro }` em vez de exceção, para o modelo poder contornar (tentar outra
 * busca) em vez de a resposta inteira morrer.
 */
export async function runReadTool(
  name: string,
  args: Record<string, unknown>,
  supabase: Supabase
): Promise<unknown> {
  try {
    switch (name) {
      case "buscar_no_prism": {
        const tipo = String(args.tipo ?? "tudo")
        const termo = String(args.termo ?? "")
        const status = args.status ? String(args.status) : undefined
        const limite = Math.min(Number(args.limite) || 10, 30)

        if (tipo === "tudo") {
          const modulos = await Promise.all(
            (["snippets", "notes", "tasks", "links"] as const).map((t) =>
              searchTable(supabase, t, termo, Math.ceil(limite / 2))
            )
          )
          return { modulos }
        }

        const table = TABLE[tipo]
        if (!table) return { erro: `Tipo desconhecido: ${tipo}` }
        return await searchTable(supabase, table, termo, limite, status)
      }

      case "ler_item_do_prism": {
        const table = TABLE[String(args.tipo ?? "")]
        if (!table) return { erro: `Tipo desconhecido: ${args.tipo}` }

        const { data, error } = await readItem(
          supabase,
          table,
          String(args.id ?? "")
        )
        if (error) return { erro: error.message }
        return data ?? { erro: "Item não encontrado." }
      }

      case "cofre_indices": {
        const vault = getVault()
        if (!vault) return { erro: "Cofre não configurado." }

        const notes = await vault.listIndexes()
        if (notes.length === 0) {
          return { erro: "Nenhum índice encontrado no cofre." }
        }
        return {
          indices: notes.map((n) => ({
            path: n.path,
            linhas: compactarIndice(n.content),
          })),
        }
      }

      case "cofre_buscar": {
        const vault = getVault()
        if (!vault) return { erro: "Cofre não configurado." }

        const hits = await vault.search(
          String(args.termo ?? ""),
          Math.min(Number(args.limite) || 8, 15)
        )
        return {
          ocorrencias: hits.map((h) => ({
            path: h.path,
            excerpt: cortar(h.excerpt, 400),
          })),
        }
      }

      case "cofre_ler": {
        const vault = getVault()
        if (!vault) return { erro: "Cofre não configurado." }

        const note = await vault.readNote(String(args.caminho ?? ""))
        if (!note) return { erro: "Nota não encontrada ou fora do cofre." }
        return { path: note.path, content: cortar(note.content, 3500) }
      }

      case "buscar_na_web": {
        if (!webSearchEnabled()) {
          return { erro: "Busca na web não está configurada." }
        }
        return await webSearch(
          String(args.consulta ?? ""),
          Math.min(Number(args.limite) || 5, 10)
        )
      }

      default:
        return { erro: `Ferramenta desconhecida: ${name}` }
    }
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : "Falha ao executar.",
    }
  }
}

/**
 * Serializa o resultado com teto de tamanho. O corte fica aqui, num lugar só,
 * porque o limite é de entrada do modelo — vale para qualquer ferramenta,
 * inclusive as que vierem depois.
 */
export function serializarResultado(resultado: unknown) {
  const texto = JSON.stringify(resultado)
  if (texto.length <= LIMITE_RESULTADO_FERRAMENTA) return texto
  return `${texto.slice(0, LIMITE_RESULTADO_FERRAMENTA)}…" [resultado cortado por tamanho]`
}
