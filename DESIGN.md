# Prism — Design System

> Linha visual de referência para **todas as próximas features**. Inspiração:
> **Orvexa — AI Operations HTML Admin Template** (ThemeForest #65042672).
> Autoria do produto: Hugo. UI em PT-BR, código em inglês.

## 0. Direção (e o que ela substitui)

O Prism migra do **tema retrô/pixel** (commits de 14/10: cantos vivos, fonte pixel,
hard-shadow, scanline) para a linha **Orvexa**: um *command dashboard* de operações de IA,
**dark-first**, limpo, denso porém arejado, com cantos arredondados e sombras suaves.

> ⚠️ Isto **aposenta** o tema retrô. Ao aplicar, remover de `globals.css`:
> `border-radius: 0 !important`, `.font-pixel`/`--font-heading` pixel, `.retro-shadow`,
> a scanline do `.dark body` e os tokens `--retro-*`. Os tokens semânticos
> (`--primary`, `--card`, `--border`, `--chart-*`, `--sidebar-*`) **permanecem** —
> só mudam de valor. Isso mantém a troca localizada em `globals.css`.

O que o Orvexa já compartilha com a stack do Prism (reaproveitar, não trocar):
**Tailwind 4**, **ícones Lucide**, **dark/light mode**. Acrescenta: fonte **Manrope**,
gráficos estilo **ApexCharts**, **sidebar expansível/compacta**.

## 1. Princípios

1. **Discreto e produtivo** — a interface some, o conteúdo aparece (filosofia Prism).
2. **Dark-first** — o tema padrão é escuro; o claro é espelho, nunca uma reflexão tardia.
3. **Hierarquia por elevação e cor**, não por borda grossa. Superfícies empilham por tom.
4. **Um acento só manda** — o roxo/indigo guia a ação primária; o resto é neutro + status.
5. **Densidade com respiro** — muitos dados, mas com espaçamento e agrupamento claros.
6. **Menos clique** — ações diretas, estados visíveis (nada de "salvei?" sem retorno).

## 2. Cor

Dark-first. Definir como tokens em `:root` (claro) e `.dark` (escuro), no mesmo esquema
que `globals.css` já usa. **Hex abaixo é a proposta inicial Orvexa** — afinar contra a
*live preview* quando acessível (ver §9).

### Escuro (padrão)
| Token | Valor | Uso |
|---|---|---|
| `--background` | `#0A0B0F` | fundo da app |
| `--card` | `#121420` | superfície de card/painel |
| `--popover` / elevado | `#1A1D2B` | menus, hover, camadas acima do card |
| `--muted` | `#15172100` → `#151721` | blocos sutis, fundos de campo |
| `--border` | `#23263A` | bordas padrão |
| `--border-strong` | `#313653` | divisores e bordas de destaque |
| `--foreground` | `#E7E9F0` | texto principal |
| `--muted-foreground` | `#9A9FB5` | texto secundário/labels |

### Claro
| Token | Valor |
|---|---|
| `--background` | `#F6F7FB` |
| `--card` | `#FFFFFF` |
| `--popover` | `#FFFFFF` |
| `--border` | `#E4E7F0` |
| `--foreground` | `#14161F` |
| `--muted-foreground` | `#5A6176` |

### Acento e semântica (ambos os temas)
| Papel | Escuro | Claro | Uso |
|---|---|---|---|
| `--primary` | `#7C6CFF` | `#6D5EF8` | ação primária, links, foco |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | texto sobre primário |
| `--ring` | `#7C6CFF` | `#6D5EF8` | anel de foco |
| success | `#35D07F` | `#17A95E` | conectado, concluído, positivo |
| warning | `#F5B13C` | `#C9881A` | atenção, pendências |
| danger / `--destructive` | `#F2635F` | `#D64545` | erro, excluir, atrasado |
| info | `#38C6E6` | `#1596B5` | neutro informativo |

### Gráficos (paleta categórica, ordem fixa)
`--chart-1..6`: `#7C6CFF`, `#38C6E6`, `#35D07F`, `#F5B13C`, `#F2635F`, `#B98CFF`.
> Antes de montar qualquer gráfico, seguir a skill **dataviz** (cor, eixos, tooltips).

### Cor por domínio (central de demandas)
- **Empresa** tem cor própria (cadastro em Configurações) — usada no ponto/trilha do card,
  no cabeçalho de coluna por empresa e no filtro. Não hardcodar: vem do banco.
- **Origem** (WhatsApp/E-mail/Chamado/Manual) usa ícone Lucide + tom neutro, não cor forte,
  para não competir com a cor da empresa.
- **Etiqueta** tem cor própria (cadastro). Renderizada como *pill* discreta.

## 3. Tipografia

- **Sans:** `Manrope` (via `next/font`), fallback `ui-sans-serif, system-ui, "Segoe UI"`.
  Usada em texto **e** títulos — aposenta a fonte pixel de heading.
- **Mono:** `JetBrains Mono` (ou manter `Space Mono`) com `font-variant-numeric: tabular-nums`
  para números (finanças, métricas, SQL) e blocos de código.
- Escala: `text-xs 12 · sm 13/14 · base 15 · lg 17 · xl 20 · 2xl 24 · 3xl 30`.
  Títulos de página `text-xl/2xl font-semibold`; títulos de card `text-sm font-semibold`
  com `tracking` levemente negativo; labels `text-xs uppercase tracking-wide text-muted-foreground`.
- Peso: corpo 400/450, ênfase 500, títulos 600. Evitar 700+ (Orvexa é sóbrio).

## 4. Forma, raio e sombra

- **Raio** (substitui o `0px` forçado):
  `--radius-sm 8px · md 10px · lg 14px · xl 18px · 2xl 24px · full 9999px`. Base `--radius: 14px`.
  Cards `rounded-xl`, campos/botões `rounded-lg`, pills/avatars `rounded-full`.
- **Sombra** suave e em camadas (nada de hard-shadow):
  - `--shadow-sm: 0 1px 2px rgba(0,0,0,.30)`
  - `--shadow-md: 0 8px 24px -6px rgba(0,0,0,.40)`
  - Card = `border` sutil **+** `shadow-sm`; em hover/ativo sobe para `shadow-md`.
  - Glow de acento (`0 0 0 1px --primary / 0 0 24px -8px --primary`) só em foco/seleção.
- **Borda** de 1px é a regra; 2px só em estado selecionado.

## 5. Espaçamento e layout

- Grade base **4px**. Gutter de página 24–32px; padding de card 20–24px; gap entre cards 16px.
- **Shell:** sidebar (expansível ↔ compacta) + topbar fina (busca global Ctrl+K, tema, perfil)
  + área de conteúdo com largura máxima confortável para tabelas densas.
- **Sidebar:** grupos da nova IA — Painel · Demandas · Conversas · Conhecimento · Finanças ·
  Assistente · Configurações. Item ativo marcado por barra/realce com `--primary`, não por caixa.
- **Dashboard (Painel):** linha de *stat tiles* no topo (número grande tabular + delta + sparkline),
  depois painéis maiores (abertos por empresa, chamados novos, atrasados, destaques).

## 6. Componentes (shadcn Base UI — prop `render`, não `asChild`)

- **Card/Painel:** título + ação opcional no canto; corpo arejado; rodapé opcional.
- **Stat tile:** label curto, número tabular, variação colorida (success/danger), mini-tendência.
- **Badge de status:** *pill* `rounded-full`, texto 12px, fundo do status a 12–16% + texto sólido.
  Ex.: conectado (success), erro (danger), pendente (warning).
- **Botão:** primário sólido `--primary`; secundário = superfície + borda; ghost p/ ações de linha.
  Altura 36 (md) / 32 (sm); `rounded-lg`.
- **Input/Select/Textarea:** fundo `--muted`, borda `--border`, foco = `--ring` + leve glow.
  Textarea em diálogo: `field-sizing-fixed h-*` e rodapé `shrink-0` (regra já existente).
- **Tabela/lista:** cabeçalho `text-xs uppercase muted`; linhas com hover sutil; zebra opcional
  muito leve; números à direita e tabulares.
- **Toast:** sonner, canto, com ícone de status. Confirmação destrutiva: AlertDialog.
- **Gráfico:** linha/área/barra sóbrios, grade discreta, tooltip escuro; paleta do §2.

## 7. Movimento

- Transições 150–240ms, `cubic-bezier(.2,.6,.2,1)`. Entradas sobem 4px + fade (como `prism-rise`).
- Respeitar `prefers-reduced-motion` (já há guarda em `globals.css`).
- Sem animação gratuita: movimento serve a mudança de estado (abrir, selecionar, atualizar).

## 8. Acessibilidade

- Contraste mínimo AA: texto corpo ≥ 4.5:1, UI ≥ 3:1. Checar o acento sobre superfícies escuras.
- Foco sempre visível (`--ring`), inclusive em navegação por teclado.
- Alvos de toque ≥ 36px; estados não dependem só de cor (ícone/forma acompanham o status).

## 9. Pendência

- **Hex exatos do Orvexa não confirmados** — a *live preview* está atrás do Cloudflare
  (não completo checagens de bot). A paleta acima é proposta fiel ao gênero; se Hugo passar
  a verificação na preview, extraio os valores reais e ajusto este arquivo.

## 10. Mapa de implementação

1. Adicionar Manrope via `next/font` e apontar `--font-sans`.
2. Em `globals.css`: reescrever os tokens de `:root`/`.dark` com a paleta do §2; definir a
   escala de raio do §4; **remover** `border-radius: 0 !important`, `.retro-shadow`,
   `.font-pixel`/heading pixel e a scanline.
3. Revisar `prism-mark.tsx` + `app/icon.svg` (geometria idêntica nos dois) para a nova linha.
4. Aplicar por módulo, começando pelo **Painel** e pela **Sidebar** (maior impacto de "fluidez").
5. Validar no preview (`prism-dev`, porta 3000) em claro e escuro antes de fechar cada tela.
