// Esta versão do lucide não traz ícones de marca (Youtube, Github),
// então os equivalentes genéricos fazem o papel.
import {
  FileSpreadsheet,
  FileText,
  GitBranch,
  HardDrive,
  Link as LinkIcon,
  Presentation,
  Video,
  type LucideIcon,
} from "lucide-react"

export type LinkSource = {
  label: string
  icon: LucideIcon
}

/**
 * Identifica de onde o link vem para dar um ícone reconhecível na lista.
 * Um Drive, um vídeo e um repositório devem se distinguir de relance, sem
 * precisar ler a URL inteira.
 */
export function sourceForUrl(url: string): LinkSource {
  let host = ""
  let path = ""
  try {
    const parsed = new URL(url)
    host = parsed.hostname.replace(/^www\./, "")
    path = parsed.pathname
  } catch {
    return { label: "Link", icon: LinkIcon }
  }

  if (host === "docs.google.com") {
    if (path.startsWith("/spreadsheets"))
      return { label: "Planilha", icon: FileSpreadsheet }
    if (path.startsWith("/presentation"))
      return { label: "Apresentação", icon: Presentation }
    if (path.startsWith("/document"))
      return { label: "Documento", icon: FileText }
    return { label: "Google Docs", icon: FileText }
  }
  if (host === "drive.google.com") return { label: "Drive", icon: HardDrive }
  if (host === "youtube.com" || host === "youtu.be")
    return { label: "Vídeo", icon: Video }
  if (host === "github.com") return { label: "GitHub", icon: GitBranch }

  return { label: host || "Link", icon: LinkIcon }
}
