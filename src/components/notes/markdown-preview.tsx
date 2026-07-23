"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="text-sm text-muted-foreground">Nada para visualizar.</p>
    )
  }

  return (
    <div className="prose prose-neutral prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
