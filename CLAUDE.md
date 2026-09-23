# Prism

Organizador pessoal de usuário único (Hugo). Filosofia: simplicidade extrema — antes de qualquer feature, perguntar "isso facilita a rotina?"; poucos cliques; interface discreta (inspiração: Linear/Notion/Vercel); dark mode padrão; UI em PT-BR, código em inglês.

## Stack e decisões

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui (variante **Base UI** — componentes usam prop `render`, não `asChild`)
- Supabase: projeto próprio em us-east-1 (o anterior, em sa-east-1, foi perdido e restaurado a partir do backup de 05/09/2026); o ref vive em `lib/supabase/config.ts`. Auth de conta única (o e-mail do dono não é versionado: repositório público); RLS em tudo restrito ao dono pela função `public.is_owner()` — trocar o dono é alterar só essa função. Bucket privado `files` no Storage.
- Schema versionado em `supabase/migrations/*.sql` (aplicar em ordem no SQL Editor). Manter esses arquivos em sincronia ao mudar o banco.
- Dados: Server Components carregam o estado inicial; mutações via `supabase-js` no client com update otimista. Sem react-query. **Uma única rota de API existe** — `src/app/api/chat/route.ts` — porque a chave da NVIDIA não pode ir para o bundle; nada além do chat deve passar por lá.
- **A resposta é revelada aos poucos** (`useRevelacao` em `message-bubble.tsx`), e isso é **só exibição**: o conteúdo completo já está no estado e a caminho do banco desde que chegou. Piso de 130 caracteres/s e aceleração proporcional ao que falta, para nunca ficar mais de 1,2s atrás do streaming. Por isso o autoscroll observa o tamanho do conteúdo (`ResizeObserver`) e não a chegada de mensagens — entre um pedaço e outro da rede o texto cresce sozinho.
- **Bloco de código traz botão de copiar** (`markdown-preview.tsx`, vale também para as Notas). O texto copiado sai de percorrer os filhos do `<code>`, não do DOM renderizado.
- **O comportamento do assistente tem três camadas, e a ordem no prompt é a precedência**: personalidade de partida (no `SYSTEM_PROMPT`, só muda com commit) → memórias `jeito` (deduzidas quando Hugo corrige) → `settings.ai_instructions` (escritas por ele em `/configuracoes`, palavra final). Cada uma tem seu marcador no template, e cada uma é lida depois da anterior — mudar a ordem muda quem vence.
- **Alterar vem antes de criar**: `propor_edicao_nota` acrescenta no fim da nota (o card lê o conteúdo atual na hora de gravar, então nada se perde mesmo que o modelo não tenha lido a nota) ou substitui quando o pedido é reescrever. Sem isso o agente criava uma segunda nota sobre o mesmo assunto e nenhuma das duas ficava certa.
- **Memória tem duas naturezas** (`memories.kind`): `fato` é conhecimento e entra no prompt junto do que o assistente já sabe; `jeito` é comportamento e entra **depois** da personalidade base, dentro da seção "Seu jeito", para vencer o padrão onde discordar. Trocar os dois faz a instrução de comportamento virar curiosidade sobre Hugo e simplesmente não valer. O `upsert` aponta para **`subject_key`** (coluna gerada, `lower(trim(subject))`), nunca para `subject`: o unique está na coluna gerada, e ON CONFLICT que não casa com índice existente é erro em runtime, não em build.
- **A marca é vetor** (`components/brand/prism-mark.tsx` e `app/icon.svg`, geometria idêntica nos dois — ao mexer numa, mexer na outra). Não há `favicon.ico`: no Next ele teria precedência sobre `icon.svg` e o ícone antigo continuaria aparecendo.
- **As conversas anteriores são fonte de consulta do agente** (`buscar_nas_conversas`, `ler_conversa` em `lib/ai/tools.ts`): o histórico sempre esteve em `chat_messages`, mas o modelo não o enxergava e cada conversa recomeçava do zero. A busca ignora `role='tool'` e devolve só o trecho em volta do termo — resultado bruto de ferramenta é volume sem sinal. Divisão de trabalho: `memories` é o punhado de fatos injetado no prompt em toda pergunta (curto por obrigação); as conversas são o arquivo que se consulta sob demanda. **Escrever no cofre pelo app ainda não é possível**: o refresh token do Drive tem escopo `drive.readonly`.
- **Configuração do chat fica no banco** (`settings`, linha única): provedor, modelo e chaves são editáveis em `/configuracoes` e vencem sobre as variáveis de ambiente, que viram padrão de fábrica (`lib/ai/settings.ts`). Trocar de modelo não exige mais commit. As `GOOGLE_*` continuam só em env
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
- Segredo nunca é versionado: o repositório é **público**. URL e chave publicável do Supabase têm padrão em `lib/supabase/config.ts` de propósito (quem protege é o RLS); `OPENAI_API_KEY`, `TAVILY_API_KEY` e as `GOOGLE_*` vivem só no `.env.local` (as duas primeiras podem ser substituídas pela tela) — ver `.env.example`
- Sem upload de arquivos: o storage do Supabase é limitado, então arquivos grandes vivem no Google Drive e o módulo **Links** guarda o endereço (tabela `links`, organizada pelas pastas de `folders`). Anexos de tarefas ainda usam o bucket `files` em `tasks/<taskId>/...`, com download via signed URL (60s). A tabela `files` ficou sem uso pela aplicação.
- Campos de texto longos: o `Textarea` do shadcn usa `field-sizing-content` e cresce sem limite; em diálogos, travar com `field-sizing-fixed h-*` e deixar o rodapé `shrink-0`, senão os botões saem da tela
- Notas guardam Markdown puro; a barra de formatação (`editor-toolbar.tsx`) só manipula texto via `lib/markdown-format.ts` — alterar marcação ali, não no componente
- Toasts com sonner; confirmações destrutivas com AlertDialog

## Comandos

- `npm run dev` / `npm run build`
- Dev preview: `.claude/launch.json` (nome `prism-dev`, porta 3000)
