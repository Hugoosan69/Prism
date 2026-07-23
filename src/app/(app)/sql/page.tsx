import { createClient } from "@/lib/supabase/server"
import { SnippetLibrary } from "@/components/sql/snippet-library"

export const dynamic = "force-dynamic"

export default async function SqlPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; snippet?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: snippets } = await supabase
    .from("snippets")
    .select("*")
    .order("is_favorite", { ascending: false })
    .order("updated_at", { ascending: false })

  return (
    <SnippetLibrary
      initialSnippets={snippets ?? []}
      openNew={params.new === "1"}
      openSnippetId={params.snippet}
    />
  )
}
