"use client"

import { usePathname } from "next/navigation"

/**
 * O contêiner das páginas.
 *
 * Todo módulo é uma coluna centrada e confortável de ler. O chat é a exceção:
 * ele precisa da altura inteira (a conversa rola, o composer fica parado) e da
 * largura inteira (a lista de conversas encosta na borda), então aqui ele fica
 * sem o padding e sem o limite de largura, e cuida do próprio espaçamento.
 */
export function PageContainer({ children }: { children: React.ReactNode }) {
  const isChat = usePathname().startsWith("/chat")

  if (isChat) {
    return <div className="flex min-h-0 flex-1 flex-col">{children}</div>
  }

  // O scroll fica no elemento de fora, para a barra encostar na borda da
  // janela em vez de aparecer no meio da tela, ao lado da coluna centrada.
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-6 py-7">{children}</div>
    </div>
  )
}
