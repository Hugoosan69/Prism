"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { LogOut } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"

type Profile = {
  email: string
  confirmado: boolean
  criadoEm: string
  ultimoAcesso: string | null
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
      {children}
    </h2>
  )
}

export default function ConfiguracoesPage() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setProfile({
        email: data.user.email ?? "",
        confirmado: Boolean(data.user.email_confirmed_at),
        criadoEm: data.user.created_at,
        ultimoAcesso: data.user.last_sign_in_at ?? null,
      })
    })
  }, [])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error("A senha precisa de pelo menos 8 caracteres.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.")
      return
    }
    setSavingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    if (error) {
      toast.error(
        error.code === "same_password"
          ? "A nova senha precisa ser diferente da atual."
          : "Não foi possível alterar a senha."
      )
      return
    }
    toast.success("Senha alterada.")
    setNewPassword("")
    setConfirmPassword("")
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Configurações" />

      <div className="space-y-8">
        {/* Perfil: quem está dentro */}
        <section className="space-y-3">
          <SectionTitle>Perfil</SectionTitle>
          <div className="rounded-xl border bg-card p-5">
            {profile ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="prism-spectrum flex size-11 shrink-0 items-center justify-center rounded-full">
                    <span className="font-mono text-base font-bold text-black/75">
                      {profile.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{profile.email}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        aria-hidden
                        className={`size-1.5 rounded-full ${
                          profile.confirmado
                            ? "bg-spec-arquivos"
                            : "bg-spec-kanban"
                        }`}
                      />
                      {profile.confirmado
                        ? "E-mail confirmado"
                        : "E-mail aguardando confirmação"}
                    </p>
                  </div>
                </div>
                <Separator className="my-4" />
                <dl className="space-y-1 font-mono text-[11px] text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <dt>Conta criada</dt>
                    <dd>
                      {format(new Date(profile.criadoEm), "dd MMM yyyy", {
                        locale: ptBR,
                      })}
                    </dd>
                  </div>
                  {profile.ultimoAcesso && (
                    <div className="flex justify-between gap-4">
                      <dt>Último acesso</dt>
                      <dd>
                        {format(
                          new Date(profile.ultimoAcesso),
                          "dd MMM yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Skeleton className="size-11 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Aparência */}
        <section className="space-y-3">
          <SectionTitle>Aparência</SectionTitle>
          <div className="flex items-center justify-between rounded-xl border bg-card p-5">
            <div>
              <Label htmlFor="dark-mode" className="font-medium">
                Modo escuro
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                O Prism nasceu escuro; o claro está aqui para os dias de sol.
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={mounted ? resolvedTheme === "dark" : true}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </div>
        </section>

        {/* Senha */}
        <section className="space-y-3">
          <SectionTitle>Senha</SectionTitle>
          <form
            onSubmit={handleChangePassword}
            className="space-y-4 rounded-xl border bg-card p-5"
          >
            <div className="space-y-2">
              <Label
                htmlFor="new-password"
                className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase"
              >
                Nova senha
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                className="h-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 8 caracteres.
              </p>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase"
              >
                Confirmar senha
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className="h-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Salvando..." : "Alterar senha"}
            </Button>
          </form>
        </section>

        {/* Sessão */}
        <section className="space-y-3">
          <SectionTitle>Sessão</SectionTitle>
          <div className="flex items-center justify-between rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground">
              Encerra a sessão neste dispositivo.
            </p>
            <Button
              variant="outline"
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Sair do Prism
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
