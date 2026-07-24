"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NAV_ITEMS } from "@/lib/navigation"

type Mode = "entrar" | "criar"

/* O login é também o índice da ferramenta: cada módulo com sua faixa
   do espectro, o mesmo vocabulário da navegação interna. */
const MODULE_HINTS: Record<string, string> = {
  Dashboard: "o dia num relance",
  Kanban: "tarefas em fluxo",
  SQL: "consultas prontas para copiar",
  Arquivos: "pastas e uploads",
  Notas: "markdown com auto-save",
  Favoritos: "links que você sempre volta",
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("entrar")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="flex min-h-svh items-center justify-center px-6 py-12">
      <div className="grid w-full max-w-4xl items-center gap-12 lg:grid-cols-[1fr_22rem] lg:gap-20">
        {/* Manifesto: o que existe atrás desta porta */}
        <aside className="hidden lg:block">
          <p className="prism-rise font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Organizador pessoal
          </p>
          <h1 className="prism-rise mt-3 text-4xl font-semibold tracking-tight [--rise-delay:60ms]">
            Prism
          </h1>

          {/* Luz branca aberta no espectro: a régua que nomeia o produto */}
          <div
            aria-hidden
            className="prism-beam prism-spectrum mt-5 h-[3px] w-44 rounded-full"
            style={{ animationDelay: "120ms" }}
          />

          <p className="prism-rise mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground [--rise-delay:180ms]">
            Tudo que você usa no dia, num lugar só.
          </p>

          <ul className="mt-10 space-y-4">
            {NAV_ITEMS.map((item, index) => (
              <li
                key={item.href}
                className="prism-rise flex items-baseline gap-3"
                style={{ ["--rise-delay" as string]: `${220 + index * 55}ms` }}
              >
                <span
                  aria-hidden
                  className="h-3 w-[3px] shrink-0 translate-y-px rounded-full"
                  style={{ background: item.accent }}
                />
                <span className="w-24 shrink-0 text-sm font-medium">
                  {item.title}
                </span>
                <span className="text-[13px] text-muted-foreground/80">
                  {MODULE_HINTS[item.title]}
                </span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Formulário */}
        <main className="mx-auto w-full max-w-sm">
          {/* Identidade compacta quando o manifesto não cabe */}
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="prism-spectrum flex size-9 items-center justify-center rounded-[10px]">
                <span className="font-mono text-sm font-bold text-black/75">
                  P
                </span>
              </div>
              <div>
                <h1 className="text-lg leading-tight font-semibold tracking-tight">
                  Prism
                </h1>
                <p className="text-xs text-muted-foreground">
                  Tudo que você usa no dia, num lugar só.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-7 shadow-sm">
            <div
              role="tablist"
              aria-label="Modo de acesso"
              className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted/60 p-1"
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
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
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
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase"
                >
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="h-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase"
                >
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "criar" ? "new-password" : "current-password"
                    }
                    className="h-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                {mode === "criar" && (
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 8 caracteres.
                  </p>
                )}
              </div>

              <div aria-live="polite" className="space-y-2 empty:hidden">
                {error && (
                  <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                {notice && (
                  <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    {notice}
                  </p>
                )}
                {precisaConfirmar && email && (
                  <button
                    type="button"
                    onClick={reenviarConfirmacao}
                    disabled={reenviando}
                    className="text-sm font-medium underline underline-offset-4 hover:text-foreground disabled:opacity-50"
                  >
                    {reenviando
                      ? "Reenviando..."
                      : "Reenviar link de confirmação"}
                  </button>
                )}
              </div>

              <Button type="submit" className="h-10 w-full" disabled={loading}>
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

          <p className="mt-5 text-center font-mono text-[11px] text-muted-foreground/60">
            Uso pessoal · dados protegidos por RLS
          </p>
        </main>
      </div>
    </div>
  )
}
