/**
 * Acesso ao cofre do Obsidian atrás de uma interface.
 *
 * Hoje o cofre é lido do disco, porque o Prism roda na máquina onde o Google
 * Drive está montado em G:. Quando o app for para a Vercel esse caminho deixa
 * de existir, e a troca precisa ser uma classe nova — não uma reescrita de
 * quem chama. Por isso as ferramentas do chat conhecem só este contrato.
 */

export type VaultNote = {
  /** Caminho relativo à raiz do cofre, com barras normais. */
  path: string
  content: string
}

export type VaultHit = {
  path: string
  /** Trecho ao redor da ocorrência, para o modelo decidir se vale abrir. */
  excerpt: string
}

export interface VaultSource {
  /** Os _INDICE-*.md, que são o ponto de entrada obrigatório do cofre. */
  listIndexes(): Promise<VaultNote[]>
  readNote(path: string): Promise<VaultNote | null>
  search(query: string, limit?: number): Promise<VaultHit[]>
}
