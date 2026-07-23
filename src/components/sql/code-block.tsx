"use client"

import { useEffect, useState } from "react"
import { codeToHtml } from "shiki"

export function CodeBlock({ code }: { code: string }) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    codeToHtml(code, {
      lang: "sql",
      themes: { light: "github-light", dark: "github-dark" },
    }).then((result) => {
      if (!cancelled) setHtml(result)
    })
    return () => {
      cancelled = true
    }
  }, [code])

  if (!html) {
    return (
      <pre className="max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
        {code}
      </pre>
    )
  }

  return (
    <div
      className="code-block max-h-64 overflow-auto rounded-md border text-xs [&_pre]:m-0 [&_pre]:p-3"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
