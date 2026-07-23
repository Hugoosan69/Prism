"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { LogOut } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"

export default function ConfiguracoesPage() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.")
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
      toast.error("Erro ao alterar a senha.")
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
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-lg font-semibold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Modo escuro</Label>
            <Switch
              id="dark-mode"
              checked={resolvedTheme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alterar senha</CardTitle>
          <CardDescription>
            Nova senha de acesso ao Prism (mínimo 8 caracteres).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Salvando..." : "Alterar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sessão</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
