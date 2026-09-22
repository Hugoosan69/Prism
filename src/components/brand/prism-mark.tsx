/**
 * A marca do Prism: o P com o balão de conversa no lugar do vazio da letra.
 *
 * Vetor, e não o PNG original, por três motivos práticos: o favicon precisa
 * ficar nítido a 16px, o fundo tem de ser transparente (o PNG vinha com fundo
 * branco, que num app dark mode aparece como um quadrado claro), e o mesmo
 * arquivo serve de 16px a 512px sem uma pilha de tamanhos.
 *
 * Os gradientes têm id fixo. Numa página com duas marcas isso duplicaria o id —
 * aceitável aqui porque o navegador resolve pelo primeiro e as duas são
 * idênticas, e o custo de gerar id único seria um useId em algo que é só
 * desenho.
 */
export function PrismMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Prism"
      className={className}
    >
      <defs>
        <linearGradient id="prism-mark-corpo" x1="0.1" y1="0.9" x2="0.95" y2="0.05">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="35%" stopColor="#2563eb" />
          <stop offset="72%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        {/* O brilho diagonal que atravessa a perna da letra. */}
        <linearGradient id="prism-mark-brilho" x1="0.1" y1="1" x2="0.8" y2="0.1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="55%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <clipPath id="prism-mark-recorte">
          <path d="M25 8 H56 a26 26 0 0 1 0 52 H42 v25 a7 7 0 0 1 -7 7 H25 a7 7 0 0 1 -7 -7 V15 a7 7 0 0 1 7 -7 Z" />
        </clipPath>
      </defs>

      <path
        d="M25 8 H56 a26 26 0 0 1 0 52 H42 v25 a7 7 0 0 1 -7 7 H25 a7 7 0 0 1 -7 -7 V15 a7 7 0 0 1 7 -7 Z"
        fill="url(#prism-mark-corpo)"
      />
      <path
        d="M-10 78 L62 36 L78 54 L-10 120 Z"
        fill="url(#prism-mark-brilho)"
        clipPath="url(#prism-mark-recorte)"
      />

      {/* O balão ocupa o vazio do P: a letra vira conversa. A ponta sai por
          baixo, à direita, e é desenhada antes para o corpo do balão cobrir a
          emenda. */}
      <path d="M57 38 L69 53 L68 38 Z" fill="#0b1030" />
      <rect x="40" y="15" width="34" height="30" rx="12" fill="#0b1030" />
      <rect x="50" y="23" width="6" height="14" rx="3" fill="#fff" />
      <rect x="60" y="23" width="6" height="14" rx="3" fill="#fff" />
    </svg>
  )
}
