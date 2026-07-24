import type { Format } from "@/components/notes/editor-toolbar"

type Result = {
  text: string
  selectionStart: number
  selectionEnd: number
}

/** Marcações que envolvem a seleção */
const WRAPPERS: Partial<Record<Format, string>> = {
  bold: "**",
  italic: "_",
  strike: "~~",
  code: "`",
}

/** Marcações que prefixam a linha inteira */
const PREFIXES: Partial<Record<Format, string>> = {
  h1: "# ",
  h2: "## ",
  h3: "### ",
  bullet: "- ",
  ordered: "1. ",
  checklist: "- [ ] ",
  quote: "> ",
}

/**
 * Prefixo de linha já existente. A ordem importa: "- [ ] " precisa ser testado
 * antes de "- ", senão uma checklist seria lida como lista simples.
 */
const PREFIX_PATTERN = /^(### |## |# |- \[[ x]\] |[-*] |\d+\. |> )/

/** Duas marcações são do mesmo tipo? ("- [x] " ainda é checklist; "3. " ainda é lista numerada) */
function samePrefixKind(current: string, target: string) {
  if (target === "- [ ] ") return /^- \[[ x]\] $/.test(current)
  if (target === "1. ") return /^\d+\. $/.test(current)
  if (target === "- ") return /^[-*] $/.test(current)
  return current === target
}

/**
 * Aplica uma marcação Markdown ao texto, respeitando a seleção atual.
 *
 * Marcações de linha alternam: aplicar a mesma duas vezes remove. Isso evita
 * acumular "## ## " quando se clica sem querer no mesmo botão.
 */
export function applyFormat(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  format: Format
): Result {
  const selected = text.slice(selectionStart, selectionEnd)

  if (format === "link") {
    const label = selected || "texto"
    const snippet = `[${label}](url)`
    const urlStart = selectionStart + label.length + 3
    return {
      text: text.slice(0, selectionStart) + snippet + text.slice(selectionEnd),
      // Deixa "url" selecionado, pronto para colar o endereço
      selectionStart: urlStart,
      selectionEnd: urlStart + 3,
    }
  }

  const wrapper = WRAPPERS[format]
  if (wrapper) {
    const before = text.slice(selectionStart - wrapper.length, selectionStart)
    const after = text.slice(selectionEnd, selectionEnd + wrapper.length)

    // Já marcado: remove
    if (before === wrapper && after === wrapper) {
      return {
        text:
          text.slice(0, selectionStart - wrapper.length) +
          selected +
          text.slice(selectionEnd + wrapper.length),
        selectionStart: selectionStart - wrapper.length,
        selectionEnd: selectionEnd - wrapper.length,
      }
    }

    const content = selected || "texto"
    return {
      text:
        text.slice(0, selectionStart) +
        wrapper +
        content +
        wrapper +
        text.slice(selectionEnd),
      selectionStart: selectionStart + wrapper.length,
      selectionEnd: selectionStart + wrapper.length + content.length,
    }
  }

  const prefix = PREFIXES[format]
  if (!prefix) {
    return { text, selectionStart, selectionEnd }
  }

  // Expande a seleção para cobrir as linhas inteiras tocadas
  const lineStart = text.lastIndexOf("\n", selectionStart - 1) + 1
  const lineEndIndex = text.indexOf("\n", selectionEnd)
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex

  const block = text.slice(lineStart, lineEnd)
  const lines = block.split("\n")

  const alreadyApplied = lines.every((line) =>
    samePrefixKind(line.match(PREFIX_PATTERN)?.[1] ?? "", prefix)
  )

  const updated = lines
    .map((line, index) => {
      const bare = line.replace(PREFIX_PATTERN, "")
      if (alreadyApplied) return bare
      // Lista numerada acompanha a sequência das linhas selecionadas
      const marker = prefix === "1. " ? `${index + 1}. ` : prefix
      return marker + bare
    })
    .join("\n")

  const newText = text.slice(0, lineStart) + updated + text.slice(lineEnd)
  return {
    text: newText,
    selectionStart: lineStart,
    selectionEnd: lineStart + updated.length,
  }
}

/** Continua listas e checklists ao pressionar Enter */
export function continueList(
  text: string,
  cursor: number
): Result | null {
  const lineStart = text.lastIndexOf("\n", cursor - 1) + 1
  const line = text.slice(lineStart, cursor)

  const match = line.match(/^(\s*)(- \[[ x]\] |[-*] |\d+\. )/)
  if (!match) return null

  const [, indent, marker] = match

  // Marcador sozinho: Enter encerra a lista em vez de criar item vazio
  if (line.trim() === marker.trim()) {
    return {
      text: text.slice(0, lineStart) + text.slice(cursor),
      selectionStart: lineStart,
      selectionEnd: lineStart,
    }
  }

  const next = marker.match(/^(\d+)\. $/)
    ? `${Number(marker.match(/^(\d+)\. $/)![1]) + 1}. `
    : marker.replace("[x]", "[ ]")

  const insertion = `\n${indent}${next}`
  return {
    text: text.slice(0, cursor) + insertion + text.slice(cursor),
    selectionStart: cursor + insertion.length,
    selectionEnd: cursor + insertion.length,
  }
}
