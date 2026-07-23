import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NoteEditor } from "@/components/notes/note-editor"

export const dynamic = "force-dynamic"

export default async function NotaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: note } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .single()

  if (!note) notFound()

  return <NoteEditor note={note} />
}
