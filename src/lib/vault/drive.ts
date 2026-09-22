/**
 * VaultSource lendo o cofre pelo Google Drive.
 *
 * É a versão que sobrevive ao deploy: na Vercel não existe `G:`, então o cofre
 * precisa vir pela API. Usa OAuth com refresh token — a conta é a do próprio
 * Hugo, e o escopo pedido é só de leitura.
 *
 * A busca aqui é mais fraca que a do disco de propósito: a API faz o
 * `fullText contains`, mas não devolve o trecho onde bateu. Para o modelo
 * receber contexto e não só um título, as notas candidatas são baixadas e
 * recortadas aqui — daí o teto baixo de resultados.
 */

import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_VAULT_FOLDER,
} from "@/lib/ai/config"
import type { VaultHit, VaultNote, VaultSource } from "./source"

const DRIVE = "https://www.googleapis.com/drive/v3"
const TOKEN_URL = "https://oauth2.googleapis.com/token"

type DriveFile = { id: string; name: string; mimeType: string }

const FOLDER_MIME = "application/vnd.google-apps.folder"

/** Escapa aspas simples: o nome vai dentro de uma string da query da API. */
function quote(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

export class DriveVault implements VaultSource {
  private token: { value: string; expiresAt: number } | null = null
  private rootId: string | null = null
  /** Caminho legível por id, montado durante a navegação das pastas. */
  private paths = new Map<string, string>()

  /**
   * Access token vive uma hora; renovar a cada chamada seria um round-trip a
   * mais por ferramenta. Guardamos em memória com margem de 60s.
   */
  private async accessToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) return this.token.value

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      throw new Error(
        `Não foi possível renovar o acesso ao Drive (${response.status}). ` +
          `O refresh token pode ter sido revogado; rode scripts/drive-auth.mjs de novo.`
      )
    }

    const data = (await response.json()) as {
      access_token: string
      expires_in: number
    }
    this.token = {
      value: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    }
    return this.token.value
  }

  private async api<T>(path: string, params: Record<string, string>) {
    const token = await this.accessToken()
    const url = `${DRIVE}${path}?${new URLSearchParams(params)}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error(`Drive respondeu ${response.status} em ${path}`)
    }
    return (await response.json()) as T
  }

  private async list(query: string): Promise<DriveFile[]> {
    const data = await this.api<{ files?: DriveFile[] }>("/files", {
      q: query,
      fields: "files(id,name,mimeType)",
      pageSize: "200",
      // Sem isto a pasta compartilhada de um Drive compartilhado não aparece.
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    })
    return data.files ?? []
  }

  /**
   * Acha a pasta raiz do cofre, uma vez por instância.
   *
   * O caminho é resolvido segmento a segmento a partir de "My Drive"
   * (`Obsidian/SEGUNDO CÉREBRO`) em vez de procurar o nome solto: "SEGUNDO
   * CÉREBRO" pode existir em mais de um lugar — uma cópia, uma pasta na
   * lixeira de outra conta — e pegar a errada silenciosamente seria pior do
   * que não achar.
   */
  private async root(): Promise<string> {
    if (this.rootId) return this.rootId

    const segments = GOOGLE_VAULT_FOLDER.split("/")
      .map((s) => s.trim())
      .filter(Boolean)

    let parent = "root"
    for (const segment of segments) {
      const folders = await this.list(
        `name = '${quote(segment)}' and mimeType = '${FOLDER_MIME}' ` +
          `and '${parent}' in parents and trashed = false`
      )
      if (folders.length === 0) {
        throw new Error(
          `Pasta "${segment}" não encontrada no Drive (caminho ` +
            `"${GOOGLE_VAULT_FOLDER}"). Confira o nome, incluindo acentos.`
        )
      }
      parent = folders[0].id
    }

    this.rootId = parent
    this.paths.set(this.rootId, "")
    return this.rootId
  }

  /** Percorre a árvore a partir da raiz, guardando o caminho de cada .md. */
  private async allNotes(): Promise<DriveFile[]> {
    const rootId = await this.root()
    const notes: DriveFile[] = []
    const queue: string[] = [rootId]

    while (queue.length > 0) {
      const folderId = queue.shift()!
      const prefix = this.paths.get(folderId) ?? ""
      const children = await this.list(
        `'${folderId}' in parents and trashed = false`
      )

      for (const child of children) {
        const path = prefix ? `${prefix}/${child.name}` : child.name
        this.paths.set(child.id, path)

        if (child.mimeType === FOLDER_MIME) {
          if (child.name.startsWith(".")) continue
          queue.push(child.id)
        } else if (child.name.endsWith(".md")) {
          notes.push(child)
        }
      }
    }

    return notes
  }

  private async download(id: string): Promise<string> {
    const token = await this.accessToken()
    const response = await fetch(
      `${DRIVE}/files/${id}?alt=media&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!response.ok) return ""
    return await response.text()
  }

  async listIndexes(): Promise<VaultNote[]> {
    const notes = await this.allNotes()
    const indexes = notes.filter((n) => n.name.startsWith("_INDICE-"))

    return await Promise.all(
      indexes.map(async (file) => ({
        path: this.paths.get(file.id) ?? file.name,
        content: await this.download(file.id),
      }))
    )
  }

  async readNote(path: string): Promise<VaultNote | null> {
    const wanted = (path.endsWith(".md") ? path : `${path}.md`)
      .replace(/^\/+/, "")
      .split("\\")
      .join("/")

    const notes = await this.allNotes()
    const match = notes.find((file) => this.paths.get(file.id) === wanted)
    if (!match) return null

    return { path: wanted, content: await this.download(match.id) }
  }

  async search(query: string, limit = 12): Promise<VaultHit[]> {
    if (!query.trim()) return []
    await this.root()

    // A API acha os candidatos; o recorte do trecho é nosso.
    const candidates = await this.list(
      `fullText contains '${quote(query)}' and trashed = false and mimeType != '${FOLDER_MIME}'`
    )

    const needle = query.toLowerCase()
    const hits: VaultHit[] = []

    for (const file of candidates.slice(0, limit)) {
      if (!file.name.endsWith(".md")) continue

      const content = await this.download(file.id)
      const at = content.toLowerCase().indexOf(needle)
      const start = at === -1 ? 0 : Math.max(0, at - 160)

      hits.push({
        path: this.paths.get(file.id) ?? file.name,
        excerpt: content.slice(start, start + 400).trim(),
      })
    }

    return hits
  }
}
