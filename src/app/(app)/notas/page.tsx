import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NotesList } from "@/components/notes/notes-list"

export const dynamic = "force-dynamic"

export default async function NotasPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  if (params.new === "1") {
    const { data } = await supabase
      .from("notes")
      .insert({ title: "", content: "" })
      .select("id")
      .single()
    if (data) redirect(`/notas/${data.id}`)
  }

  const { data: notes } = await supabase
    .from("notes")
    .select("id, title, content, is_favorite, updated_at, created_at")
    .order("is_favorite", { ascending: false })
    .order("updated_at", { ascending: false })

  return <NotesList notes={notes ?? []} />
}
