# Prism

Organizador pessoal de usuário único (Hugo). Filosofia: simplicidade extrema — antes de qualquer feature, perguntar "isso facilita a rotina?"; poucos cliques; interface discreta (inspiração: Linear/Notion/Vercel); dark mode padrão; UI em PT-BR, código em inglês.

## Stack e decisões

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui (variante **Base UI** — componentes usam prop `render`, não `asChild`)
- Supabase: projeto próprio em us-east-1 (o anterior, em sa-east-1, foi perdido e restaurado a partir do backup de 05/09/2026); o ref vive em `lib/supabase/config.ts`. Auth de conta única (o e-mail do dono não é versionado: repositório público); RLS em tudo restrito ao dono pela função `public.is_owner()` — trocar o dono é alterar só essa função. Bucket privado `files` no Storage.
- Schema versionado em `supabase/migrations/*.sql` (aplicar em ordem no SQL Editor). Manter esses arquivos em sincronia ao mudar o banco.
- Dados: Server Components carregam o estado inicial; mutações via `supabase-js` no client com update otimista. Sem react-query. **Uma única rota de API existe** — `src/app/api/chat/route.ts` — porque a chave da NVIDIA não pode ir para o bundle; nada além do chat deve passar por lá.
- Chat de IA (`/chat`, a tela inicial): **OpenAI `gpt-4.1-mini`**, chamado por `fetch` puro em `lib/ai/client.ts` (sem SDK). O arquivo não tem nome de fornecedor de propósito: trocar de provedor é mexer em `AI_BASE_URL`, `AI_MODEL` e na chave, em `lib/ai/config.ts`. Já houve duas trocas — NVIDIA (Nemotron 550B) saiu por levar de 4 a 20 s até o primeiro token; Groq (qwen3.8-27b) era rápido mas o plano gratuito só dava 7.000 tokens de entrada por minuto, e uma pergunta ao cofre consumia a cota inteira.
- **Tudo que uma ferramenta devolve volta ao modelo em toda rodada seguinte** e agora se paga por token. Daí os tetos em `lib/ai/config.ts` (`LIMITE_RESULTADO_FERRAMENTA`, `LIMITE_TEXTO_LONGO`, `LIMITE_HISTORICO`, `MAX_TOOL_ROUNDS`) e a compactação dos índices do cofre em `lib/ai/tools.ts`. Ao criar ferramenta nova, pensar no tamanho do retorno como parte do desenho.
- O `SYSTEM_PROMPT` é um template literal: **crase dentro dele fecha a string** e o build morre com "Expected a semicolon" apontando para uma linha de prosa. Nome de ferramenta no prompt vai sem crase.
- Sem triggers no banco; `updated_at` é atualizado pela aplicação. A única function é `is_owner()`, usada pelas policies.

## Estrutura

- `src/app/(app)/*` — rotas protegidas (chat, dashboard, kanban, sql, links, notas, favoritos, configuracoes); `/` e o pós-login vão para `/chat`; `src/app/login` — login; `src/app/redefinir-senha` — destino do link de recuperação
- `src/middleware.ts` — protege tudo exceto `/login`
- `src/components/<módulo>/*` — componentes por módulo; `src/components/ui` — shadcn (não editar à mão sem necessidade)
- `src/lib/supabase/{client,server}.ts` — clients (@supabase/ssr); `src/lib/database.types.ts` — tipos gerados (regenerar via MCP `generate_typescript_types` após mudar o schema); `src/lib/types.ts` — aliases e labels

## Convenções

- Deep links por query param: `?new=1` abre criação; `?task=<id>` / `?snippet=<id>` abrem edição; `?pasta=<id>` navega pastas
- Kanban tem 4 estágios (`todo`/`doing`/`waiting`/`done`) definidos em `lib/types.ts` — adicionar um exige alterar o check constraint de `tasks.status` junto. Só `done` grava `completed_at`. Três eixos independentes por tarefa: prioridade (`priority`, o ponto colorido), urgência (a `position` na coluna, exibida como rank; topo = mais urgente) e destaque (`highlighted`, estrela âmbar que não mexe na ordem)
- Pesquisa global: Ctrl+K (`search-command.tsx`), ilike em todas as tabelas, inclusive nas mensagens do chat
- Segredo nunca é versionado: o repositório é **público**. URL e chave publicável do Supabase têm padrão em `lib/supabase/config.ts` de propósito (quem protege é o RLS); `OPENAI_API_KEY`, `TAVILY_API_KEY` e as `GOOGLE_*` vivem só no `.env.local` — ver `.env.example`
- Sem upload de arquivos: o storage do Supabase é limitado, então arquivos grandes vivem no Google Drive e o módulo **Links** guarda o endereço (tabela `links`, organizada pelas pastas de `folders`). Anexos de tarefas ainda usam o bucket `files` em `tasks/<taskId>/...`, com download via signed URL (60s). A tabela `files` ficou sem uso pela aplicação.
- Campos de texto longos: o `Textarea` do shadcn usa `field-sizing-content` e cresce sem limite; em diálogos, travar com `field-sizing-fixed h-*` e deixar o rodapé `shrink-0`, senão os botões saem da tela
- Notas guardam Markdown puro; a barra de formatação (`editor-toolbar.tsx`) só manipula texto via `lib/markdown-format.ts` — alterar marcação ali, não no componente
- Toasts com sonner; confirmações destrutivas com AlertDialog

## Comandos

- `npm run dev` / `npm run build`
- Dev preview: `.claude/launch.json` (nome `prism-dev`, porta 3000)
