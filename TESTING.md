# Prism — Testing

> Objetivo: **gerar e guardar testes automatizados** que ficam no repositório, para que
> cada mudança seja verificada por um comando — não por verificação manual repetida (que
> gasta tokens à toa a cada rodada). Teste escrito uma vez, roda de graça para sempre.

## Princípio

Toda vez que um comportamento for verificado "na mão" (abrir a tela, conferir cálculo,
testar um prompt), **esse esforço vira teste guardado**. O teto de gasto de tokens é
decisão de projeto (ver nota do Segundo Cérebro `Orcamento-de-contexto...`); testes
determinísticos tiram a IA do loop de verificação.

## Estado atual

- **Não há infraestrutura de teste** no projeto (sem runner no `package.json`, sem specs).
- Esta é a justificativa concreta para adicionar dependências de teste
  (regra: dependência nova só com problema concreto — e aqui o problema é gasto de token
  em re-verificação).

## Camadas

### 1. Unit — lógica pura (prioridade máxima, barato e determinístico)
Runner: **Vitest**. Alvos onde a regra de negócio mora:
- `lib/financas.ts` — projeção de recorrência (mensal/parcelada/única), "quanto falta pagar",
  mês como string `YYYY-MM-01` comparado como texto (o bug de fuso que vira 31/07). **Caso de
  teste obrigatório:** `new Date("2026-08-01")` **não** deve ser usado para calcular mês.
- `lib/ai/settings.ts` / `lib/ai/config.ts` — resolução de provedor/modelo/chave:
  banco vence, env é padrão de fábrica; e (futuro) **modelo por superfície** (chat/gmail/
  chamados/whatsapp) resolvendo o modelo certo.
- `lib/ai/tools.ts` — compactação de índices, tetos de retorno (`LIMITE_*`), busca que casa
  palavra e não frase, filtro que ignora `role='tool'`.
- `lib/markdown-format.ts` — barra de formatação das Notas (manipula texto, não DOM).
- `cofreLigado(settings)` e montagem de credenciais do Drive a partir de `settings`.

### 2. Integração — Supabase (RLS e mutações)
- Rodar contra um **branch Supabase** (MCP `create_branch`) ou projeto local, nunca produção.
- Verificar que `is_owner()` barra o que não é do dono em cada tabela nova.
- Toggle de pagamento idempotente: marcar = insert, desmarcar = delete, `amount_paid` congela
  o valor vigente.

### 3. E2E — fluxos críticos de UI
Runner: **Playwright**. Poucos, caros, só o que quebra silencioso:
- Login → redirect para `/chat` (ou novo `/painel`).
- Criar card no kanban e movê-lo entre os 4 estágios (`todo/doing/waiting/done`).
- Deep links (`?new=1`, `?task=<id>`, `?snippet=<id>`, `?pasta=<id>`).
- Busca global Ctrl+K retornando de todas as tabelas.
- **Central de demandas (quando existir):** integração salva aparece na lista com status;
  "testar conexão" reflete o resultado; comando do WhatsApp vira card com referência à origem.

### 4. Modelo/Prompt — fora do app (evita o maior gasto)
Script que chama a **API real com o prompt real** (padrão já aprendido:
`Testar-o-modelo-fora-do-app`). Pega o que build e tipo não pegam, funciona mesmo com o app
atrás de login. Guardar como script versionado, **rodado sob demanda e com aprovação**
(chamada paga — regra `Chamadas-de-API-so-com-aprovacao`), não no CI automático.
- Verifica: tool-calling dispara a ferramenta certa; resposta não estoura `MAX_TOOL_ROUNDS`;
  `max_completion_tokens` aceito pela série 5 da OpenAI; cada provedor novo (Gemini, Kimi)
  responde no dialeto esperado.

## Convenções

- Specs ao lado do alvo: `lib/financas.test.ts`; E2E em `tests/e2e/*.spec.ts`.
- Nome do caso descreve a **regra**, não a função (`projeta parcelada até a última parcela`).
- Todo bug corrigido ganha um teste que falha antes do fix (regressão).
- Chave de API **nunca** em teste versionado — vem de env/segredo do CI.

## Comandos (a adicionar ao `package.json`)
```
npm run test         # vitest run (unit + integração)
npm run test:watch   # vitest --watch
npm run test:e2e     # playwright test
npm run test:model   # script de prompt real — só com aprovação, chamada paga
```

## Armadilhas do ambiente
- Projeto vive em pasta do **Google Drive** (`G:\`): `npm install` é lento e já falhou com
  EBADF/`node_modules` vazio **saindo com código 0** (nota `Projeto-em-pasta-do-Google-Drive...`).
  Conferir `node_modules` após instalar dependências de teste; junction não funciona em `G:`.
