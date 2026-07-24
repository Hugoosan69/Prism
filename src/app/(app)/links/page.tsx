import { createClient } from "@/lib/supabase/server"
import { LinkBrowser } from "@/components/links/link-browser"
import type { Folder } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ pasta?: string; new?: string }>
}) {
  const params = await searchParams
  const folderId = params.pasta ?? null
  const supabase = await createClient()

  const [foldersResult, linksResult] = await Promise.all([
    folderId
      ? supabase
          .from("folders")
          .select("*")
          .eq("parent_id", folderId)
          .order("name")
      : supabase
          .from("folders")
          .select("*")
          .is("parent_id", null)
          .order("name"),
    folderId
      ? supabase
          .from("links")
          .select("*")
          .eq("folder_id", folderId)
          .order("is_favorite", { ascending: false })
          .order("title")
      : supabase
          .from("links")
          .select("*")
          .is("folder_id", null)
          .order("is_favorite", { ascending: false })
          .order("title"),
  ])

  // Monta o breadcrumb subindo a cadeia de pastas
  const breadcrumb: Folder[] = []
  let currentId = folderId
  while (currentId) {
    const { data: folder } = await supabase
      .from("folders")
      .select("*")
      .eq("id", currentId)
      .single()
    if (!folder) break
    breadcrumb.unshift(folder)
    currentId = folder.parent_id
  }

  return (
    <LinkBrowser
      folderId={folderId}
      breadcrumb={breadcrumb}
      initialFolders={foldersResult.data ?? []}
      initialLinks={linksResult.data ?? []}
      openNew={params.new === "1"}
    />
  )
}
