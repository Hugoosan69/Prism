import { createClient } from "@/lib/supabase/server"
import { FileBrowser } from "@/components/files/file-browser"
import type { Folder } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function ArquivosPage({
  searchParams,
}: {
  searchParams: Promise<{ pasta?: string; upload?: string }>
}) {
  const params = await searchParams
  const folderId = params.pasta ?? null
  const supabase = await createClient()

  const [foldersResult, filesResult] = await Promise.all([
    folderId
      ? supabase.from("folders").select("*").eq("parent_id", folderId).order("name")
      : supabase.from("folders").select("*").is("parent_id", null).order("name"),
    folderId
      ? supabase.from("files").select("*").eq("folder_id", folderId).order("name")
      : supabase.from("files").select("*").is("folder_id", null).order("name"),
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
    <FileBrowser
      folderId={folderId}
      breadcrumb={breadcrumb}
      initialFolders={foldersResult.data ?? []}
      initialFiles={filesResult.data ?? []}
      autoUpload={params.upload === "1"}
    />
  )
}
