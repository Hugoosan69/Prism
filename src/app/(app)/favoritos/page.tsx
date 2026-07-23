import { createClient } from "@/lib/supabase/server"
import { BookmarkList } from "@/components/bookmarks/bookmark-list"

export const dynamic = "force-dynamic"

export default async function FavoritosPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .order("category")
    .order("title")

  return (
    <BookmarkList initialBookmarks={bookmarks ?? []} openNew={params.new === "1"} />
  )
}
