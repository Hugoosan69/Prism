"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Status = "verificando" | "pronto" | "invalido"

/**
 * Destino do link de recuperação enviado por e-mail. Ao abrir, o cliente do
 * Supabase troca o código da URL por uma sessão temporária; com ela, o
 * formulário grava a nova senha.
 */
export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("verificando")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Link expirado ou aberto em outro navegador chega com erro explícito
    const url = new URL(window.location.href)
    const hash = new URLSearchParams(url.hash.slice(1))
    if (url.searchParams.get("error") || hash.get("error")) {
      setStatus("invalido")
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setStatus("pronto")
    })

    // A troca do código acontece no carregamento; aguarda a sessão aparecer
    let tries = 0
    const timer = setInterval(async () => {
      tries += 1
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setStatus("pronto")
        clearInterval(timer)
      } else if (tries >= 10) {
        setStatus((s) => (s === "verificando" ? "invalido" : s))
        clearInterval(timer)
      }
    }, 500)

    return () => {
      subscription.unsubscribe()
      clearInterval(timer)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("A senha precisa de pelo menos 8 caracteres.")
      return
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.")
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (error) {
      setError(
        error.code === "same_password"
          ? "A nova senha precisa ser diferente da atual."
          : `Não foi possível salvar: ${error.message}`
      )
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="prism-spectrum flex size-9 items-center justify-center rounded-[10px]">
            <span className="font-mono text-sm font-bold text-black/75">P</span>
          </div>
          <div>
            <h1 className="text-lg leading-tight font-semibold tracking-tight">
              Prism
            </h1>
            <p className="text-xs text-muted-foreground">
              Redefinição de senha
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-7 shadow-sm">
          {status === "verificando" && (
            <p className="text-sm text-muted-foreground">
              Verificando o link de recuperação...
            </p>
          )}

          {status === "invalido" && (
            <div className="space-y-4">
              <p className="text-sm">
                Este link de recuperação expirou ou já foi usado.
              </p>
              <p className="text-sm text-muted-foreground">
                Abra o link no mesmo navegador em que pediu a recuperação, ou
                solicite um novo.
              </p>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full"
                )}
              >
                Pedir novo link
              </Link>
            </div>
          )}

          {status === "pronto" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="nova-senha"
                  className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase"
                >
                  Nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="nova-senha"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="h-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo de 8 caracteres.
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmar-senha"
                  className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase"
                >
                  Confirmar senha
                </Label>
                <Input
                  id="confirmar-senha"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="h-10"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              <div aria-live="polite" className="empty:hidden">
                {error && (
                  <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>

              <Button type="submit" className="h-10 w-full" disabled={saving}>
                {saving ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
