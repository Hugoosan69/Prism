# Prism — Prompt de Implementação · Fase 0 (Repaginação + Configurações)

> Para o agente executor. Você vai implementar a **Fase 0** da transformação do Prism em
> **central de demandas**. Não é um rascunho de ideias: é trabalho de produção, com migração de
> dados real e sem perder funcionalidade. Leia tudo antes de tocar em qualquer arquivo.

## 0. Antes de começar — leia o contexto

Leia, nesta ordem, e trate como fonte de verdade:
1. `AGENTS.md` — mapa do projeto e decisões que não se leem no código.
2. `CLAUDE.md` — convenções e armadilhas detalhadas.
3. `DESIGN.md` — a linha visual Orvexa que **todas** as telas desta fase devem seguir.
4. `NEXT_STEPS.md` — o roadmap; esta fase é a 0.
5. `prompt-prism-central-de-demandas.md` — o briefing original do Hugo.
6. `TESTING.md` — como deixar os testes guardados.

Depois **leia o código e o banco atuais** antes de propor schema: a tela
`src/app/(app)/configuracoes/page.tsx`, a tabela `settings` (linha única), as migrations em
`supabase/migrations/` (a próxima é a **0015**), `src/lib/ai/{config,settings,client,prompt,tools}.ts`
e `src/lib/{types,navigation}.ts`.

## 1. Regras invioláveis

- **Não perder dados.** Toda mudança de schema é migration versionada em `supabase/migrations/`,
  aplicada em ordem no SQL Editor. Dado existente é **migrado**, nunca descartado.
- **RLS em toda tabela nova**, restrita ao dono pela função `public.is_owner()` — o mesmo padrão
  de policy das tabelas atuais. Não invente outra forma de autorização.
- **Nada de campo livre** para empresa, origem, etiqueta, comando ou modelo: tudo vem de cadastro.
- **Segredo nunca legível pelo front.** Credencial de integração e chave de modelo ficam no banco,
  criptografadas, acessíveis só por edge function. A **listagem devolve só `has_*`/status**, nunca
  o segredo. Lembre: nenhum recurso pode depender só de `process.env` (o banco é a fonte, a env é
  padrão de fábrica — ver `lib/ai/settings.ts`).
- **shadcn Base UI:** componentes usam a prop `render`, **não** `asChild`.
- **Regenerar `src/lib/database.types.ts`** (MCP `generate_typescript_types`) após cada migration.
- **Aprovação por etapa:** ao fim de cada bloco abaixo (1 a 6), pare, mostre o que mudou e o
  resultado da verificação, e espere o OK do Hugo antes do próximo. Não emende os blocos.

## 2. Escopo da Fase 0 (o que entregar)

Seis blocos. Faça nesta ordem — os primeiros dão "fluidez" com risco baixo; os últimos mexem no banco.

### Bloco 1 — Diagnóstico (só leitura, nada de código)
Produza um relatório curto: estrutura atual de rotas/sidebar, o que a tela de Configurações já faz,
colunas reais de `settings`, forma da tabela `tasks` (incl. `tags text[]` e o check de `status`
com os 4 estágios), e como as policies RLS/`is_owner()` estão escritas. Aponte qualquer conflito
com o plano abaixo **antes** de prosseguir.

### Bloco 2 — Reskin visual (DESIGN.md), começando por Painel + Sidebar
- Adicionar **Manrope** via `next/font` e apontar `--font-sans`.
- Reescrever os tokens de `:root`/`.dark` em `src/app/globals.css` com a paleta do `DESIGN.md`;
  definir a escala de raio; **remover** `border-radius: 0 !important`, `.retro-shadow`,
  a fonte pixel de heading e a scanline do `.dark body`. Aposentar os tokens `--retro-*` só depois
  que nenhum componente os usar.
- Revisar `prism-mark.tsx` + `app/icon.svg` (geometria idêntica nos dois).
- Aplicar a linha nova primeiro no **Painel** e na **Sidebar**; validar claro e escuro.
> Objetivo deste bloco: a plataforma já parece mais fluída, sem nenhuma tela ter perdido função.

### Bloco 3 — Navegação em 7 áreas (reorganização, não reconstrução)
Reagrupar a sidebar em: **Painel** · **Demandas** · **Conversas** · **Conhecimento** ·
**Finanças** · **Assistente** · **Configurações**. As telas atuais continuam existindo **intactas**
por baixo — só mudam de lugar no menu:
- Painel = o dashboard (vira a home). **Demandas** = o kanban. **Conhecimento** = notas + snippets +
  links + bookmarks + pastas/arquivos. **Assistente** = o chat + memórias. **Conversas** fica como
  área preparada (vazia/placeholder nesta fase; conteúdo nas Fases 1–2).
- `/` e o pós-login passam de `/chat` para `/painel` (confirmar com o Hugo — muda hábito diário).
- A divisão de módulos é dado, não código (como já é hoje em `useModuleConfig`).

### Bloco 4 — Schema da central de demandas (migrations + migração de dados)
Criar (a partir da **0015**), com RLS `is_owner()` em todas:
- `companies` (nome, cor, horário de expediente, flag "padrão para itens sem empresa").
- `sources` (WhatsApp, E-mail, Chamado, Manual — editáveis; semear esses quatro).
- `labels` (nome, cor, `company_id` opcional) e `task_labels` (N:N com `tasks`).
- `commands` (gatilho, ação, valores padrão: empresa/prioridade/coluna/etiquetas, flags de apagar
  mensagem e enviar confirmação). Só estrutura + CRUD nesta fase; a execução é Fase 1.
- `integrations` (tipo `waha|gmail|glpi|zoho`, apelido, `company_id`, status, última sincronização,
  `has_*`/segredo cifrado à parte).
- `ai_models` (provedor, modelo, base_url, chave cifrada, apelido, status) e `ai_assignments`
  (superfície `chat|gmail|chamados` → `model_id`). Generalização de `lib/ai/settings.ts`: resolver
  o modelo por superfície, mantendo o `fetch` puro de `lib/ai/client.ts` e endpoints compatíveis
  com OpenAI; campo de "dialeto" para exceções (ex.: série 5 da OpenAI usa `max_completion_tokens`).
- Alterar `tasks`: `company_id`, `source_id`, referência externa (`external_type`, `external_id`,
  `external_url`), e `context` (texto capturado). **Migrar `tasks.tags` (text[]) → `labels` +
  `task_labels`** criando as etiquetas distintas e os vínculos; só então parar de usar a coluna
  `tags` (mantê-la por ora para não perder nada — remover em migration posterior após conferência).

### Bloco 5 — Configurações: os cadastros, robustos e com retorno
Nova aba/área de Configurações com lista para cada cadastro (Empresas, Origens, Etiquetas, Comandos,
Integrações, Modelos de IA). Cada lista:
- mostra os itens já salvos com **badge de status**; ao salvar, dá toast **e** o item aparece/atualiza
  na lista (nunca "digitou e sumiu");
- **Integrações** e **Modelos**: botão **"testar conexão"** que faz chamada real (via edge function
  quando há segredo) e reflete o resultado no status; o segredo nunca volta na listagem (só `has_*`).
- Login pela plataforma preparado aqui (fluxo detalhado nas Fases 1–2): WhatsApp mostrará o QR do
  WAHA via edge function; Gmail abrirá o OAuth reaproveitando `drive_app_id`/`drive_app_secret`.

### Bloco 6 — Cards ligados à origem
No card do kanban: mostrar empresa (cor), origem (ícone), etiquetas (pills) e um botão
**"abrir origem"** que usa `external_url`. Filtros em Demandas por empresa, origem, etiqueta e
prioridade.

## 3. Verificação (deixe testes guardados — ver TESTING.md)
- `npm run build` limpo e preview (`prism-dev`, porta 3000) conferido em **claro e escuro**.
- Subir a infra de teste (Vitest) e escrever unit para a resolução de modelo por superfície e para
  a migração `tags → labels` (não perder nenhuma etiqueta). E2E (Playwright) para: criar card,
  salvar uma integração e vê-la aparecer na lista com status.
- Chave de API nunca em teste versionado nem em resposta.

## 4. Fora de escopo agora (não implementar)
Webhook/comandos do WhatsApp em execução (Fase 1), ingestão de Gmail (Fase 2), GLPI (Fase 3),
Zoho e o Assistente virando agente (futuro). Nesta fase, **Conversas** é só a casca preparada.

## 5. Ao terminar cada bloco
Pare, resuma o que mudou (arquivos, migrations, dados migrados), cole o resultado da verificação,
e espere o OK antes do próximo. Atualize `NEXT_STEPS.md` marcando o que foi concluído.
