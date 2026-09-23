/**
 * O cofre é lido pela API do Google Drive, e só por ela.
 *
 * Ler o `G:` direto do disco chegou a existir e foi descartado: amarrava o chat
 * à máquina de Hugo e criava um segundo caminho para manter. O Drive é a fonte
 * em desenvolvimento e em produção, igual nos dois.
 */

import { cofreLigado, type AiSettings } from "@/lib/ai/settings"
import { DriveVault } from "./drive"
import type { VaultSource } from "./source"

/**
 * As credenciais chegam por parâmetro, e não de constante de módulo, porque o
 * que vale é a configuração resolvida — banco primeiro, ambiente como padrão
 * de fábrica.
 */
export function getVault(settings: AiSettings): VaultSource | null {
  return cofreLigado(settings) ? new DriveVault(settings.drive) : null
}

export type { VaultSource } from "./source"
