/**
 * Execução das ferramentas de escrita no servidor.
 *
 * Isto só roda quando a ação direta está ligada **e** a resposta não tocou em
 * fonte externa — ver `ehFonteExterna`. Nos outros casos a escrita continua
 * virando card, e quem grava é o client.
 *
 * Todo retorno traz o que é preciso para desfazer: o id da linha criada, ou o
 * conteúdo anterior no caso de uma edição. Escrita sem volta é o que torna a
 * autonomia assustadora; com desfazer, ela é só conveniência.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { EXTERNAL_TOOL_NAMES } from "./tools"

type Supabase = SupabaseClient<Database>

/** Leu web ou cofre? Então há texto de terceiro no contexto desta resposta. */
export const ehFonteExterna = (nome: string) => EXTERNAL_TOOL_NAMES.has(nome)

export type Efeito = {
  /** Frase curta para a tela: "Criado em Notas". */
  resumo: string
  /** Onde desfazer mexe. */
  desfazer:
    | { tipo: "apagar"; tabela: "tasks" | "notes" | "snippets" | "links"; id: string }
    | { tipo: "restaurar_nota"; id: string; conteudo: string; titulo: string }
    | { tipo: "nenhum" }
}

function str(valor: unknown): string {
  return typeof valor === "string" ? valor : ""
}

/**
 * Grava de verdade. Devolve `null` quando a ferramenta não é de escrita
 * conhecida, e lança quando o banco recusa — quem chama transforma em erro na
 * tela sem derrubar a resposta.
 */
export async function executarEscrita(
  supabase: Supabase,
  nome: string,
  args: Record<string, unknown>
): Promise<Efeito | null> {
  switch (nome) {
    case "propor_tarefa": {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: str(args.titulo),
          description: str(args.descricao),
          status: str(args.status) || "todo",
          priority: str(args.prioridade) || "medium",
          tags: Array.isArray(args.tags) ? args.tags.map(String) : [],
        })
        .select("id")
        .single()
      if (error) throw new Error(error.message)
      return {
        resumo: "Criado no Kanban",
        desfazer: { tipo: "apagar", tabela: "tasks", id: data.id },
      }
    }

    case "propor_nota": {
      const { data, error } = await supabase
        .from("notes")
        .insert({ title: str(args.titulo), content: str(args.conteudo) })
        .select("id")
        .single()
      if (error) throw new Error(error.message)
      return {
        resumo: "Criado em Notas",
        desfazer: { tipo: "apagar", tabela: "notes", id: data.id },
      }
    }

    case "propor_edicao_nota": {
      const id = str(args.id)
      const { data: atual } = await supabase
        .from("notes")
        .select("content, title")
        .eq("id", id)
        .maybeSingle()
      if (!atual) throw new Error("Essa nota não existe.")

      const juntar = str(args.acrescentar).trim()
      const substituir = str(args.conteudo).trim()
      const conteudo = juntar
        ? `${atual.content.trimEnd()}\n\n${juntar}`
        : substituir || atual.content

      const mudancas: { content: string; updated_at: string; title?: string } = {
        content: conteudo,
        updated_at: new Date().toISOString(),
      }
      if (str(args.titulo).trim()) mudancas.title = str(args.titulo).trim()

      const { error } = await supabase.from("notes").update(mudancas).eq("id", id)
      if (error) throw new Error(error.message)

      // Guarda o estado anterior inteiro: desfazer uma edição é restaurar, não
      // apagar — a nota existia antes e tem de continuar existindo depois.
      return {
        resumo: juntar ? "Acrescentado à nota" : "Nota substituída",
        desfazer: {
          tipo: "restaurar_nota",
          id,
          conteudo: atual.content,
          titulo: atual.title,
        },
      }
    }

    case "propor_snippet": {
      const { data, error } = await supabase
        .from("snippets")
        .insert({
          title: str(args.titulo),
          code: str(args.codigo),
          description: str(args.descricao),
          category: str(args.categoria),
        })
        .select("id")
        .single()
      if (error) throw new Error(error.message)
      return {
        resumo: "Salvo em SQL",
        desfazer: { tipo: "apagar", tabela: "snippets", id: data.id },
      }
    }

    case "propor_link": {
      const { data, error } = await supabase
        .from("links")
        .insert({
          title: str(args.titulo),
          url: str(args.url),
          description: str(args.descricao),
        })
        .select("id")
        .single()
      if (error) throw new Error(error.message)
      return {
        resumo: "Salvo em Links",
        desfazer: { tipo: "apagar", tabela: "links", id: data.id },
      }
    }

    case "propor_memoria": {
      const { error } = await supabase.from("memories").upsert(
        {
          subject: str(args.assunto),
          content: str(args.fato),
          kind: str(args.tipo) === "jeito" ? "jeito" : "fato",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "subject_key" }
      )
      if (error) throw new Error(error.message)
      // Sem desfazer: o upsert pode ter substituído uma memória anterior, e
      // "apagar" devolveria o errado. Corrigir é na tela de Configurações.
      return { resumo: "Guardado na memória", desfazer: { tipo: "nenhum" } }
    }

    default:
      return null
  }
}
