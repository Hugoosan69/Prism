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

  const [foldersResult, linksResult, allFoldersResult, allLinksResult] =
    await Promise.all([
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
      // Todas as pastas alimentam o seletor de destino ao mover
      supabase.from("folders").select("*").order("name"),
      // Contagem por pasta, para o card dizer o que há dentro
      supabase.from("links").select("folder_id"),
    ])

  const allFolders = allFoldersResult.data ?? []

  const counts = new Map<string, number>()
  for (const link of allLinksResult.data ?? []) {
    if (!link.folder_id) continue
    counts.set(link.folder_id, (counts.get(link.folder_id) ?? 0) + 1)
  }
  for (const folder of allFolders) {
    if (!folder.parent_id) continue
    counts.set(folder.parent_id, (counts.get(folder.parent_id) ?? 0) + 1)
  }

  // Monta o breadcrumb subindo a cadeia de pastas
  const breadcrumb: Folder[] = []
  let currentId = folderId
  while (currentId) {
    const folder = allFolders.find((f) => f.id === currentId)
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
      allFolders={allFolders}
      folderCounts={Object.fromEntries(counts)}
      openNew={params.new === "1"}
    />
  )
}
