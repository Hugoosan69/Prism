# Prism

Organizador pessoal de usuário único (Hugo). Filosofia: simplicidade extrema — antes de qualquer feature, perguntar "isso facilita a rotina?"; poucos cliques; interface discreta (inspiração: Linear/Notion/Vercel); dark mode padrão; UI em PT-BR, código em inglês.

## Stack e decisões

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui (variante **Base UI** — componentes usam prop `render`, não `asChild`)
- Supabase: projeto `ukewaugpbrorabmeptip` (sa-east-1). Auth de conta única (`hugoosan69@gmail.com`); RLS em tudo restrito ao dono pela função `public.is_owner()` — trocar o dono é alterar só essa função. Bucket privado `files` no Storage.
- Schema versionado em `supabase/migrations/*.sql` (aplicar em ordem no SQL Editor). Manter esses arquivos em sincronia ao mudar o banco.
- Dados: Server Components carregam o estado inicial; mutações via `supabase-js` no client com update otimista. Sem camada de API, sem react-query.
- Sem triggers no banco; `updated_at` é atualizado pela aplicação. A única function é `is_owner()`, usada pelas policies.

## Estrutura

- `src/app/(app)/*` — rotas protegidas (dashboard, kanban, sql, arquivos, notas, favoritos, configuracoes); `src/app/login` — login
- `src/middleware.ts` — protege tudo exceto `/login`
- `src/components/<módulo>/*` — componentes por módulo; `src/components/ui` — shadcn (não editar à mão sem necessidade)
- `src/lib/supabase/{client,server}.ts` — clients (@supabase/ssr); `src/lib/database.types.ts` — tipos gerados (regenerar via MCP `generate_typescript_types` após mudar o schema); `src/lib/types.ts` — aliases e labels

## Convenções

- Deep links por query param: `?new=1` abre criação; `?task=<id>` / `?snippet=<id>` abrem edição; `?pasta=<id>` navega pastas
- Pesquisa global: Ctrl+K (`search-command.tsx`), ilike em todas as tabelas
- Uploads: bucket `files`, caminhos `tasks/<taskId>/...` e `arquivos/<folderId|raiz>/...`; download via signed URL (60s)
- Toasts com sonner; confirmações destrutivas com AlertDialog

## Comandos

- `npm run dev` / `npm run build`
- Dev preview: `.claude/launch.json` (nome `prism-dev`, porta 3000)
