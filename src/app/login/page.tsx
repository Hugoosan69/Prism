"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Mode = "entrar" | "criar"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("entrar")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [precisaConfirmar, setPrecisaConfirmar] = useState(false)
  const [reenviando, setReenviando] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setNotice(null)
    setPrecisaConfirmar(false)
  }

  async function reenviarConfirmacao() {
    setReenviando(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: "signup", email })
    setReenviando(false)
    if (error) {
      setError(`Não foi possível reenviar: ${error.message}`)
      return
    }
    setNotice(`Novo link enviado para ${email}. Verifique também o spam.`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    const supabase = createClient()

    if (mode === "criar") {
      if (password.length < 8) {
        setError("A senha precisa de pelo menos 8 caracteres.")
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) {
        setError(
          error.code === "user_already_exists"
            ? "Essa conta já existe. Use “Entrar”."
            : error.code === "signup_disabled"
              ? "Cadastro desabilitado no Supabase. Habilite em Authentication → Sign In / Up."
              : `Não foi possível criar a conta: ${error.message}`
        )
        setLoading(false)
        return
      }

      // Sem sessão = o Supabase está exigindo confirmação por e-mail.
      if (!data.session) {
        setNotice(
          `Conta criada. Enviamos um link de confirmação para ${email} — confirme e volte para entrar.`
        )
        setPrecisaConfirmar(true)
        setMode("entrar")
        setLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Mostrar sempre "senha incorreta" esconde falhas de configuração
      // (chave inválida, e-mail não confirmado) e dificulta o diagnóstico.
      if (error.code === "email_not_confirmed") {
        setError("Confirme seu e-mail antes de entrar.")
        setPrecisaConfirmar(true)
      } else {
        setError(
          error.code === "invalid_credentials"
            ? "E-mail ou senha incorretos."
            : `Falha ao entrar: ${error.message}`
        )
      }
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4">
      {/* Luz difusa atrás do prisma */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-18%] left-1/2 size-[36rem] -translate-x-1/2 rounded-full opacity-[0.07] blur-3xl prism-spectrum"
      />

      <div className="relative w-full max-w-[22rem]">
        <div className="mb-9 flex flex-col items-center gap-4">
          <div className="prism-spectrum flex size-11 items-center justify-center rounded-xl">
            <span className="font-mono text-lg font-bold text-black/75">P</span>
          </div>
          <div className="space-y-1.5 text-center">
            <h1 className="text-xl font-semibold tracking-tight">Prism</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "entrar"
                ? "Tudo que você usa no dia, num lugar só."
                : "Crie sua conta para começar."}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {/* tablist: descreve a alternância entre os dois modos e evita que
              o alternador e o botão de envio anunciem o mesmo nome */}
          <div
            role="tablist"
            aria-label="Modo de acesso"
            className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted/60 p-1"
          >
            {(["entrar", "criar"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                id={`tab-${value}`}
                aria-selected={mode === value}
                aria-controls="form-acesso"
                onClick={() => switchMode(value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === value
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value === "entrar" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form
            id="form-acesso"
            role="tabpanel"
            aria-labelledby={`tab-${mode}`}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={
                  mode === "criar" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {mode === "criar" && (
                <p className="text-xs text-muted-foreground">
                  Mínimo de 8 caracteres.
                </p>
              )}
            </div>

            <div aria-live="polite" className="space-y-2">
              {error && <p className="text-sm text-destructive">{error}</p>}
              {notice && (
                <p className="text-sm text-muted-foreground">{notice}</p>
              )}
              {precisaConfirmar && email && (
                <button
                  type="button"
                  onClick={reenviarConfirmacao}
                  disabled={reenviando}
                  className="text-sm font-medium underline underline-offset-4 hover:text-foreground disabled:opacity-50"
                >
                  {reenviando ? "Reenviando..." : "Reenviar link de confirmação"}
                </button>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? mode === "criar"
                  ? "Criando..."
                  : "Entrando..."
                : mode === "criar"
                  ? "Criar conta"
                  : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
