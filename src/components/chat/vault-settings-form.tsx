"use client"

/**
 * Credenciais do Drive para o cofre, editáveis sem deploy.
 *
 * Elas viviam só em variável de ambiente, por uma decisão que parecia certa:
 * trocá-las exige refazer o consentimento OAuth, logo não é ajuste de rotina.
 * O que essa decisão não previu foi o ambiente **não chegar ao processo** — aí
 * o cofre se desligava e não havia nenhum caminho para religá-lo pela tela.
 * Agora o banco vence e o ambiente é o padrão de fábrica, como no resto.
 *
 * As duas chaves nunca voltam preenchidas: o campo abre vazio com os últimos
 * caracteres da atual no lugar da dica, só para reconhecer qual está valendo.
 */

import { useEffect, useState } from "react"
import { Check, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TablesUpdate } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"

type Estado = {
  clientId: string
  folder: string
  temSecret: boolean
  fimSecret: string
  temToken: boolean
  fimToken: string
}

function fim(valor: string) {
  return valor ? `…${valor.slice(-4)}` : ""
}

export function VaultSettingsForm() {
  const [estado, setEstado] = useState<Estado | null>(null)
  const [novoSecret, setNovoSecret] = useState("")
  const [novoToken, setNovoToken] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data } = await createClient()
        .from("settings")
        .select("drive_app_id, drive_app_secret, drive_renewal, drive_folder")
        .maybeSingle()

      setEstado({
        clientId: data?.drive_app_id ?? "",
        folder: data?.drive_folder ?? "",
        temSecret: Boolean(data?.drive_app_secret),
        fimSecret: fim(data?.drive_app_secret ?? ""),
        temToken: Boolean(data?.drive_renewal),
        fimToken: fim(data?.drive_renewal ?? ""),
      })
    }

    carregar().catch(() =>
      setEstado({
        clientId: "",
        folder: "",
        temSecret: false,
        fimSecret: "",
        temToken: false,
        fimToken: "",
      })
    )
  }, [])

  async function salvar() {
    if (!estado) return
    setSalvando(true)

    const mudancas: TablesUpdate<"settings"> = {
      drive_app_id: estado.clientId.trim(),
      drive_folder: estado.folder.trim(),
      updated_at: new Date().toISOString(),
    }
    if (novoSecret.trim()) mudancas.drive_app_secret = novoSecret.trim()
    if (novoToken.trim()) mudancas.drive_renewal = novoToken.trim()

    const { error } = await createClient()
      .from("settings")
      .upsert({ id: true, ...mudancas })

    setSalvando(false)
    if (error) {
      toast.error("Não deu para salvar as credenciais do cofre.")
      return
    }

    setEstado({
      ...estado,
      temSecret: estado.temSecret || Boolean(novoSecret.trim()),
      fimSecret: novoSecret.trim() ? fim(novoSecret.trim()) : estado.fimSecret,
      temToken: estado.temToken || Boolean(novoToken.trim()),
      fimToken: novoToken.trim() ? fim(novoToken.trim()) : estado.fimToken,
    })
    setNovoSecret("")
    setNovoToken("")
    toast.success("Cofre configurado. Recarregue a página para ver o selo.")
  }

  async function limparToken() {
    const { error } = await createClient()
      .from("settings")
      .update({ drive_renewal: "", updated_at: new Date().toISOString() })
      .eq("id", true)

    if (error || !estado) {
      toast.error("Não deu para remover.")
      return
    }
    setEstado({ ...estado, temToken: false, fimToken: "" })
    toast.success("Token removido. Volta a valer o do ambiente, se houver.")
  }

  if (!estado) {
    return <p className="text-xs text-muted-foreground">Carregando…</p>
  }

  const completo =
    estado.clientId.trim().length > 0 &&
    (estado.temSecret || novoSecret.trim().length > 0) &&
    (estado.temToken || novoToken.trim().length > 0)

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="drive-id" className="text-xs">
          ID do cliente OAuth
        </Label>
        <Input
          id="drive-id"
          value={estado.clientId}
          onChange={(e) => setEstado({ ...estado, clientId: e.target.value })}
          placeholder="…apps.googleusercontent.com"
          autoComplete="off"
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="drive-secret" className="text-xs">
          Secret do cliente OAuth
        </Label>
        <Input
          id="drive-secret"
          type="password"
          value={novoSecret}
          onChange={(e) => setNovoSecret(e.target.value)}
          placeholder={
            estado.temSecret
              ? `configurado (${estado.fimSecret}) — preencha para trocar`
              : "sem secret"
          }
          autoComplete="off"
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="drive-token" className="text-xs">
          Refresh token
        </Label>
        <div className="flex gap-2">
          <Input
            id="drive-token"
            type="password"
            value={novoToken}
            onChange={(e) => setNovoToken(e.target.value)}
            placeholder={
              estado.temToken
                ? `configurado (${estado.fimToken}) — preencha para trocar`
                : "sem token — o cofre fica desligado"
            }
            autoComplete="off"
            className="flex-1 font-mono text-sm"
          />
          {estado.temToken && (
            <Button
              variant="ghost"
              size="sm"
              onClick={limparToken}
              title="Remover o token salvo"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Sai de <span className="font-mono">node scripts/drive-auth.mjs</span>.
          Expira em 7 dias enquanto a tela de consentimento do Google estiver em
          modo Testing.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="drive-folder" className="text-xs">
          Pasta do cofre
        </Label>
        <Input
          id="drive-folder"
          value={estado.folder}
          onChange={(e) => setEstado({ ...estado, folder: e.target.value })}
          placeholder="Obsidian/SEGUNDO CÉREBRO"
          className="font-mono text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          Caminho a partir do Meu Drive, com acentos. Vazio usa o padrão.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={salvar} disabled={salvando} className="gap-2">
          <Check className="size-4" />
          {salvando ? "Salvando…" : "Salvar credenciais"}
        </Button>
        {!completo && (
          <span className="text-[11px] text-muted-foreground">
            Faltando algum dos três: o cofre continua desligado.
          </span>
        )}
      </div>
    </div>
  )
}
