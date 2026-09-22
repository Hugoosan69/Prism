"use client"

/**
 * Configuração do chat: provedor, modelo e chaves, editáveis sem deploy.
 *
 * A chave nunca volta preenchida para a tela — o campo fica vazio com os
 * últimos caracteres da atual ao lado, só para você reconhecer qual está lá.
 * Campo vazio significa "não mexe"; para desligar, existe o botão de remover.
 */

import { useEffect, useState } from "react"
import { Check, Eye, EyeOff, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TablesUpdate } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"

/** Sugestões conhecidas; o campo aceita qualquer nome de modelo. */
const MODELOS = [
  "gpt-5.4-nano",
  "gpt-5.4-mini",
  "gpt-4.1-mini",
  "gpt-5-nano",
]

type Estado = {
  baseUrl: string
  model: string
  temChaveIa: boolean
  fimChaveIa: string
  temChaveWeb: boolean
  fimChaveWeb: string
}

/** Só o suficiente para reconhecer a chave, nunca a chave. */
function fim(valor: string) {
  return valor ? `…${valor.slice(-4)}` : ""
}

export function AiSettingsForm() {
  const [estado, setEstado] = useState<Estado | null>(null)
  const [novaChaveIa, setNovaChaveIa] = useState("")
  const [novaChaveWeb, setNovaChaveWeb] = useState("")
  const [mostrarIa, setMostrarIa] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    // Sempre sai do "carregando", mesmo com erro ou tabela vazia: um formulário
    // em branco ainda dá para usar; um "Carregando…" eterno, não.
    async function carregar() {
      const supabase = createClient()
      const { data } = await supabase
        .from("settings")
        .select("ai_base_url, ai_model, ai_api_key, tavily_api_key")
        .maybeSingle()

      setEstado({
        baseUrl: data?.ai_base_url ?? "",
        model: data?.ai_model ?? "",
        temChaveIa: Boolean(data?.ai_api_key),
        fimChaveIa: fim(data?.ai_api_key ?? ""),
        temChaveWeb: Boolean(data?.tavily_api_key),
        fimChaveWeb: fim(data?.tavily_api_key ?? ""),
      })
    }

    carregar().catch(() =>
      setEstado({
        baseUrl: "",
        model: "",
        temChaveIa: false,
        fimChaveIa: "",
        temChaveWeb: false,
        fimChaveWeb: "",
      })
    )
  }, [])

  async function salvar() {
    if (!estado) return
    setSalvando(true)

    const mudancas: TablesUpdate<"settings"> = {
      ai_base_url: estado.baseUrl.trim(),
      ai_model: estado.model.trim(),
      updated_at: new Date().toISOString(),
    }
    // Campo de chave vazio quer dizer "mantém a que está lá".
    if (novaChaveIa.trim()) mudancas.ai_api_key = novaChaveIa.trim()
    if (novaChaveWeb.trim()) mudancas.tavily_api_key = novaChaveWeb.trim()

    const supabase = createClient()
    // upsert e não update: se a linha singleton ainda não existir (migration
    // aplicada sem o insert), salvar criaria ela em vez de não fazer nada.
    const { error } = await supabase
      .from("settings")
      .upsert({ id: true, ...mudancas })

    setSalvando(false)
    if (error) {
      toast.error("Não deu para salvar a configuração.")
      return
    }

    setEstado({
      ...estado,
      temChaveIa: estado.temChaveIa || Boolean(novaChaveIa.trim()),
      fimChaveIa: novaChaveIa.trim() ? fim(novaChaveIa.trim()) : estado.fimChaveIa,
      temChaveWeb: estado.temChaveWeb || Boolean(novaChaveWeb.trim()),
      fimChaveWeb: novaChaveWeb.trim()
        ? fim(novaChaveWeb.trim())
        : estado.fimChaveWeb,
    })
    setNovaChaveIa("")
    setNovaChaveWeb("")
    toast.success("Configuração salva. Vale na próxima mensagem.")
  }

  async function limpar(campo: "ai_api_key" | "tavily_api_key") {
    const patch: TablesUpdate<"settings"> =
      campo === "ai_api_key"
        ? { ai_api_key: "", updated_at: new Date().toISOString() }
        : { tavily_api_key: "", updated_at: new Date().toISOString() }

    const supabase = createClient()
    const { error } = await supabase.from("settings").update(patch).eq("id", true)

    if (error) {
      toast.error("Não deu para remover.")
      return
    }
    if (!estado) return
    setEstado({
      ...estado,
      ...(campo === "ai_api_key"
        ? { temChaveIa: false, fimChaveIa: "" }
        : { temChaveWeb: false, fimChaveWeb: "" }),
    })
    toast.success("Chave removida. Volta a valer a do ambiente, se houver.")
  }

  if (!estado) {
    return <p className="text-xs text-muted-foreground">Carregando…</p>
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="modelo" className="text-xs">
          Modelo
        </Label>
        <Input
          id="modelo"
          value={estado.model}
          onChange={(e) => setEstado({ ...estado, model: e.target.value })}
          placeholder="gpt-5.4-nano"
          list="modelos-conhecidos"
          className="font-mono text-sm"
        />
        <datalist id="modelos-conhecidos">
          {MODELOS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <p className="text-[11px] text-muted-foreground">
          Vazio usa o padrão do código. Modelos maiores respondem melhor e mais
          devagar.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="provedor" className="text-xs">
          Provedor
        </Label>
        <Input
          id="provedor"
          value={estado.baseUrl}
          onChange={(e) => setEstado({ ...estado, baseUrl: e.target.value })}
          placeholder="https://api.openai.com/v1"
          className="font-mono text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          Qualquer endereço no formato da OpenAI. Trocar de provedor exige
          trocar a chave junto.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="chave-ia" className="text-xs">
          Chave da API do modelo
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="chave-ia"
              type={mostrarIa ? "text" : "password"}
              value={novaChaveIa}
              onChange={(e) => setNovaChaveIa(e.target.value)}
              placeholder={
                estado.temChaveIa
                  ? `configurada (${estado.fimChaveIa}) — preencha para trocar`
                  : "sem chave — o chat fica desligado"
              }
              autoComplete="off"
              className="pr-9 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setMostrarIa((v) => !v)}
              aria-label={mostrarIa ? "Ocultar" : "Mostrar"}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {mostrarIa ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </button>
          </div>
          {estado.temChaveIa && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => limpar("ai_api_key")}
              title="Remover a chave salva"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="chave-web" className="text-xs">
          Chave da busca na web (Tavily)
        </Label>
        <div className="flex gap-2">
          <Input
            id="chave-web"
            type="password"
            value={novaChaveWeb}
            onChange={(e) => setNovaChaveWeb(e.target.value)}
            placeholder={
              estado.temChaveWeb
                ? `configurada (${estado.fimChaveWeb}) — preencha para trocar`
                : "sem chave — o chat não busca na web"
            }
            autoComplete="off"
            className="flex-1 font-mono text-sm"
          />
          {estado.temChaveWeb && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => limpar("tavily_api_key")}
              title="Remover a chave salva"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <Button onClick={salvar} disabled={salvando} className="gap-2">
        <Check className="size-4" />
        {salvando ? "Salvando…" : "Salvar configuração"}
      </Button>
    </div>
  )
}
