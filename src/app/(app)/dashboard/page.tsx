import { redirect } from "next/navigation"

// O Painel é a nova home (antes /dashboard). Mantido o redirect para não
// quebrar atalhos antigos apontando para /dashboard.
export default function DashboardPage() {
  redirect("/painel")
}
