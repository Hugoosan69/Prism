/**
 * O cofre é lido pela API do Google Drive, e só por ela.
 *
 * Ler o `G:` direto do disco chegou a existir e foi descartado: amarrava o chat
 * à máquina de Hugo e criava um segundo caminho para manter. O Drive é a fonte
 * em desenvolvimento e em produção, igual nos dois.
 */

import { driveVaultEnabled } from "@/lib/ai/config"
import { DriveVault } from "./drive"
import type { VaultSource } from "./source"

export function getVault(): VaultSource | null {
  return driveVaultEnabled() ? new DriveVault() : null
}

export type { VaultSource } from "./source"
