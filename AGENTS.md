# Prism — Contexto do Projeto (começe por aqui)

> Guia portátil para qualquer agente/sessão retomar o Prism **de qualquer máquina**.
> Detalhe técnico fino vive no [CLAUDE.md](CLAUDE.md) — este arquivo é o mapa + o rumo.
> Documentos irmãos: [DESIGN.md](DESIGN.md) · [TESTING.md](TESTING.md) · [NEXT_STEPS.md](NEXT_STEPS.md).

## O que é

Organizador pessoal de **usuário único** (Hugo) — um "Jarvis" pessoal (ainda sem a parte de
agente autônomo). Filosofia: **simplicidade extrema** — antes de qualquer feature, perguntar
"isso facilita a rotina?". Poucos cliques, interface discreta. UI em **PT-BR**, código em **inglês**.

**Rumo atual:** virar uma **central de demandas** — tudo que é trabalho (WhatsApp, Gmail,
chamados) vira card e nada se perde — e **repaginar** a plataforma para a linha visual Orvexa,
**sem perder nenhuma funcionalidade atual**. Briefing completo:
[prompt-prism-central-de-demandas.md](prompt-prism-central-de-demandas.md).

Hugo presta suporte ao ERP **WinThor** em dois lugares: **Disdal** (CLT, chamados no **GLPI**)
e **Inko** (PJ, chamados no **Zoho**, fase futura).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** + **Tailwind v4** +
  **shadcn/ui variante Base UI** (componentes usam prop `render`, **não** `asChild`).
- **Supabase** (us-east-1), conta única, **RLS em tudo** via `public.is_owner()` — trocar o
  dono = alterar só essa função. Bucket privado `files`. Ref em `lib/supabase/config.ts`.
- Dados: Server Components carregam estado inicial; mutações via `supabase-js` no client com
  update otimista. **Sem react-query.** Única rota de API: `src/app/api/chat/route.ts`
  (a chave do provedor de IA não pode ir pro bundle).
- **Repositório é público** → nenhum segredo versionado. URL + chave publicável do Supabase
  têm padrão em código de propósito (quem protege é o RLS).
- Ícones **Lucide**, drag-and-drop **dnd-kit**, toasts **sonner**, código **shiki**.
- Bibliotecas: só com necessidade concreta (sem dependência por elegância).

## Estrutura

- `src/app/(app)/*` — rotas protegidas (chat, dashboard, kanban, sql, financas, links, notas,
  favoritos, configuracoes). `/` e pós-login → `/chat` (migrará para `/painel`).
- `src/app/login`, `src/app/redefinir-senha`; `src/middleware.ts` protege tudo exceto `/login`.
- `src/components/<módulo>/*`; `src/components/ui` = shadcn (não editar à mão sem necessidade).
- `src/lib/supabase/{client,server}.ts`; `src/lib/database.types.ts` (regenerar via MCP
  `generate_typescript_types` após mudar schema); `src/lib/types.ts` (aliases e labels).
- `supabase/migrations/*.sql` — schema versionado, **aplicar em ordem no SQL Editor**;
  manter em sincronia ao mudar o banco. Sem triggers; `updated_at` é da aplicação;
  única function é `is_owner()`.

## Banco (tabelas atuais)

`tasks`, `notes`, `snippets`, `links`, `folders`, `files`, `attachments`, `bookmarks`,
`chat_threads`, `chat_messages`, `memories`, `settings`, `expenses`, `expense_payments`,
`incomes`. (`files` ficou sem uso pela aplicação; anexos de tarefa usam o bucket `files`.)

## Decisões que não se descobrem lendo o código (resumo — detalhe no CLAUDE.md)

- **Finanças projetam, não geram linhas:** a despesa tem `start_month` e `lib/financas.ts`
  projeta os meses. Pagamento é linha em `expense_payments` (toggle idempotente); `amount_paid`
  congela o valor vigente. Mês = string `YYYY-MM-01` comparada como texto (fuso quebra `Date`).
- **IA desacoplada do fornecedor:** `lib/ai/client.ts` usa `fetch` puro; trocar provedor é mexer
  em `AI_BASE_URL`/`AI_MODEL`/chave. Hoje OpenAI `gpt-4.1-mini`. Já passou por NVIDIA e Groq.
- **Config de IA e do Drive vivem no banco** (`settings`), vencendo as env (padrão de fábrica).
  Lição dura: **nenhum recurso pode depender só de `process.env`** (em 23/09 as env sumiram em
  produção). Toda credencial precisa de rota que não passe pelo deploy.
- **Comportamento do assistente em 3 camadas, ordem no prompt = precedência:** personalidade
  base (`SYSTEM_PROMPT`) → memórias `jeito` → `settings.ai_instructions`.
- **Memória tem duas naturezas** (`memories.kind`): `fato` (conhecimento, entra junto do que já
  sabe) e `jeito` (comportamento, entra depois da personalidade base). `upsert` em `subject_key`.
- **Conversas antigas são fonte de consulta** (`buscar_nas_conversas`/`ler_conversa`); busca
  casa palavra, ignora `role='tool'`.
- **Crase dentro do `SYSTEM_PROMPT` (template literal) quebra o build** — nome de ferramenta sem crase.
- **Sem `favicon.ico`** (teria precedência sobre `icon.svg`). Marca em `prism-mark.tsx` e
  `app/icon.svg` com geometria idêntica — mexeu numa, mexe na outra.

## Design, Testes, Rumo

- **Design:** [DESIGN.md](DESIGN.md) — linha Orvexa (dark-first, Manrope, cantos arredondados,
  sombras suaves). **Aposenta o tema retrô** de 14/10.
- **Testes:** [TESTING.md](TESTING.md) — Vitest (unit), Playwright (E2E), script de prompt real.
  Hoje **não há infra de teste**; é a próxima dívida a pagar para parar de queimar token em
  re-verificação manual.
- **Próximos passos / roadmap:** [NEXT_STEPS.md](NEXT_STEPS.md).

## Como rodar

- `npm run dev` / `npm run build` (ambos `--turbopack`).
- Preview: `.claude/launch.json` (nome `prism-dev`, porta 3000).
- **Atenção:** projeto em pasta do Google Drive (`G:\`) — `npm install` é lento e já falhou
  silenciosamente (EBADF, `node_modules` vazio, código 0). Conferir após instalar.

## Memória de longo prazo (Segundo Cérebro)

Hugo mantém um cofre Obsidian (`G:\Meu Drive\Obsidian\SEGUNDO CÉREBRO`) lido automaticamente no
início de cada sessão do Claude Code. **Antes** de executar: consultar os índices por temas
relacionados (inclusive de outros projetos). **Depois** de entregar: registrar padrões,
decisões, preferências, status e aprendizados, atualizando notas em vez de duplicar.
Notas-chave do Prism: `Prism`, `Stack-Prism`, `Provedor-de-LLM-e-peca-substituivel`,
`Recorrencia-se-projeta-nao-se-gera`, `Configuracao-no-banco-com-env-como-padrao-de-fabrica`.
