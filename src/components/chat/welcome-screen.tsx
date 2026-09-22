"use client"

/**
 * Tela de entrada do chat: saudação, composer no centro e atalhos.
 *
 * A saudação depende da hora e é calculada depois da montagem, não no
 * servidor: na Vercel o servidor vive em UTC, e renderizar "Boa noite" lá para
 * um "Boa tarde" aqui daria mismatch de hidratação além de dizer a hora errada.
 */

import { useEffect, useState } from "react"
import { Database, Sparkles, StickyNote, Search } from "lucide-react"
import { PrismMark } from "@/components/brand/prism-mark"

const ATALHOS = [
  {
    icon: Database,
    label: "Achar uma consulta",
    prompt: "Qual consulta eu tenho salva para rejeição de GTIN?",
  },
  {
    icon: StickyNote,
    label: "Revisar o dia",
    prompt: "O que está pendente no meu Kanban agora?",
  },
  {
    icon: Search,
    label: "Buscar no Segundo Cérebro",
    prompt: "O que o Segundo Cérebro guarda sobre RLS no Supabase?",
  },
]

function saudacao(hora: number) {
  if (hora < 6) return "Boa madrugada"
  if (hora < 12) return "Bom dia"
  if (hora < 18) return "Boa tarde"
  return "Boa noite"
}

export function WelcomeScreen({
  enabled,
  onPick,
  composer,
}: {
  enabled: boolean
  onPick: (prompt: string) => void
  composer: React.ReactNode
}) {
  const [hora, setHora] = useState<number | null>(null)
  useEffect(() => setHora(new Date().getHours()), [])

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <PrismMark className="size-7" />
          <h1 className="text-2xl font-medium tracking-tight">
            {/* Sem a hora ainda, mostra só o nome: evita piscar a saudação errada. */}
            {hora === null ? "Olá, Hugo" : `${saudacao(hora)}, Hugo`}
          </h1>
        </div>

        {composer}

        {!enabled ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            O chat está desligado: falta <code>OPENAI_API_KEY</code> nas
            variáveis de ambiente.
          </p>
        ) : (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {ATALHOS.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => onPick(prompt)}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Sparkles className="size-3" />
          Ele lê o que você já guardou antes de procurar fora.
        </p>
      </div>
    </div>
  )
}
