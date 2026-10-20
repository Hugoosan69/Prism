/**
 * Lógica pura da migração `tasks.tags` -> `labels` + `task_labels` (migration
 * 0020). O SQL é a fonte de verdade; esta função espelha a regra para poder ser
 * testada: etiqueta distinta por nome normalizado (case-insensitive), vazios
 * ignorados, e nenhum vínculo duplicado para a mesma tarefa. A invariante que
 * importa: nenhuma etiqueta existente pode ser perdida.
 */
export type TagTaskInput = { id: string; tags: string[] }

export type TagMigrationResult = {
  /** Nomes de etiqueta distintos (primeira grafia vista). */
  labels: string[]
  /** Vínculos tarefa↔etiqueta, pela chave normalizada da etiqueta. */
  links: { taskId: string; labelKey: string }[]
}

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase()
}

export function migrateTags(tasks: TagTaskInput[]): TagMigrationResult {
  const labelByKey = new Map<string, string>()
  const links: { taskId: string; labelKey: string }[] = []
  const seen = new Set<string>()

  for (const task of tasks) {
    for (const raw of task.tags) {
      const name = raw.trim()
      if (!name) continue
      const key = normalizeTag(name)
      if (!labelByKey.has(key)) labelByKey.set(key, name)
      const linkKey = `${task.id}::${key}`
      if (!seen.has(linkKey)) {
        seen.add(linkKey)
        links.push({ taskId: task.id, labelKey: key })
      }
    }
  }

  return { labels: [...labelByKey.values()], links }
}
