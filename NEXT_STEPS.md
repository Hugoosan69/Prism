# Prism — Próximos Passos

> Rumo da transformação em **central de demandas** + repaginação visual.
> Fonte: [prompt-prism-central-de-demandas.md](prompt-prism-central-de-demandas.md).
> Regras-mãe: ler código/banco antes de propor · não perder dados (tudo via migration com
> migração dos dados atuais) · RLS em toda tabela nova · **plano aprovado antes de cada fase** ·
> nada de campo livre (empresa/origem/etiqueta/comando vêm de cadastros) · segredo nunca legível
> pelo front. Atualizado: 2026-10-19.

## Decisões já tomadas nesta rodada

- **Repaginação separada da reconstrução:** primeiro só reorganizar a navegação (as 7 áreas
  como agrupamento, telas atuais intactas por baixo); só depois somar capacidade nova. Reduz o
  risco de sumir funcionalidade.
- **Design = linha Orvexa** (ver [DESIGN.md](DESIGN.md)); **aposenta o tema retrô** de 14/10.
- **Integrações robustas, com retorno visível:** tabela própria `integrations` (não colunas
  soltas em `settings`), lista com badge de status + "testar conexão"; segredo guardado nunca
  volta na listagem (só `has_*`/status), criptografado, acessível só por edge function.
- **Login das integrações pela própria plataforma** (padrão do CRM Psi): WhatsApp via QR do WAHA
  buscado por edge function; Gmail via OAuth reaproveitando o app do Drive (`drive_app_*`) + escopo.
- **Agente de IA multi-modelo, um por superfície:** registro de modelos (`ai_models`) + mapa de
  atribuição (chat/gmail/chamados → modelo). Usar endpoints compatíveis com OpenAI de cada
  provedor (Gemini, Kimi/Moonshot) para manter o `fetch` puro; campo de "dialeto" p/ exceções.
- **SEM agente no WhatsApp** — descartado (seria redundante; a ideia era de outro projeto).
  O WhatsApp no Prism é captura de demanda + conversas + comandos, não um bot que responde.

## Entrega imediata (antes de codar)

1. **Diagnóstico** (só leitura) do código e banco atuais: `/configuracoes` de hoje, tabela
   `settings`, como o Drive guarda credencial, schema completo.
2. **Plano da Fase 0** para Hugo aprovar: IA de navegação, telas, migrations e migração dos
   dados existentes (ex.: `tasks.tags` texto → tabela de etiquetas).

## Fase 0 — Repaginação + Configurações

> **Status: implementada (Blocos 1–6), 2026-10-19.** Validada por `npm run build`
> limpo num workspace espelhado no disco C: (o `npm` no G:/Google Drive falha em
> silêncio). Decisões tomadas na execução (reversíveis): **home `/chat` → `/painel`**;
> **segredo das integrações/modelos via Supabase Vault**, lido só pela edge function
> `conectar` (migration 0025: `app_set_secret`/`app_get_secret`, EXECUTE só para
> `service_role`). Migrations 0015–0025 aplicadas no projeto; `tags` migradas para
> `labels`+`task_labels` (6 etiquetas, 18 vínculos, coluna `tags` mantida).
>
> **Pendências herdadas para a Fase 1+ (não bloqueiam a Fase 0):**
> - O chat (`/chat`) ainda lê modelo/chave de `settings`/env; `lib/ai/resolve-model.ts`
>   (resolução por superfície, com fallback) já existe e tem teste, mas **a rota
>   `api/chat` ainda não foi religada** a ele — fazer quando houver modelo+chave
>   cadastrados, sem derrubar o chat atual.
> - "Testar conexão" faz chamada real para **modelo** (`/models`) e **WAHA**
>   (`/api/sessions`); **Gmail/GLPI** retornam "pendente" (Fases 2–3).
> - Remover a coluna `tasks.tags` só em migration posterior, após conferência.
> - Infra de teste: Vitest instalado + specs de `resolve-model` e `tags-to-labels`;
>   falta E2E (Playwright) e rodar `vitest` localmente no G: (usar workspace em C:).

- **Navegação (7 áreas):** Painel (home, resumo do dia — só aqui, sem WhatsApp) · Demandas
  (kanban com filtros empresa/origem/etiqueta/prioridade) · Conversas · Conhecimento (notas,
  snippets, links, bookmarks, pastas/arquivos) · Finanças · Assistente (chat + memórias;
  arquitetura pronta para virar agente) · Configurações.
  - Decidir: home passa de `/chat` para `/painel` (muda hábito diário). **Confirmar com Hugo.**
- **Cadastros (Configurações):** Empresas (nome, cor, expediente, padrão) · Origens · Etiquetas
  (cor, vínculo opcional a empresa) · **Comandos** (construtor: gatilho → ação → padrões) ·
  **Integrações** (tipo, credenciais, status, vínculo com empresa).
- **`tasks`:** `company_id`, `source_id`, referência externa (tipo + id + URL), relação com
  etiquetas (substitui `tags` texto, **migrando os dados**), contexto capturado; botão
  "abrir origem" no card.

## Fase 1 — WhatsApp (WAHA)

- WAHA já roda na VPS (mesma do CRM). Sessão configurada em Integrações.
- **Atenção (lição registrada):** sessão WAHA é recurso único — não compartilhar a mesma sessão
  entre ambientes/consumidores (derrubou produção no CRM).
- Edge function de webhook, protegida por segredo/HMAC, assinando **`message.any`** (pega
  também as minhas mensagens, onde estão os comandos).
- Tabelas próprias: `wa_contacts`, `wa_chats`, `wa_messages`.
- Tela de conversas: lista, leitura, resposta (envio via API do WAHA), etiquetas por conversa,
  vínculo com empresa pelo contato, indicação de cards ligados.
- Grupos: separar/silenciar/destacar só quando mencionado.
- Comandos: se `fromMe` e começa com gatilho cadastrado → executa ação; se for resposta citando
  outra mensagem, a citada vira descrição do card; guardar referência + últimas N mensagens.

## Fase 2 — Gmail (múltiplas contas)

- OAuth, uma ou mais contas, cada uma vinculada a uma empresa. Reaproveitar o app OAuth do
  Google já existente (`drive_app_id`/`drive_app_secret`) + escopo do Gmail.
- Marcador configurável por conta (ex.: "Demanda") → vira card (assunto, remetente, trecho, link).
- Sincronização: push (Pub/Sub) vs polling incremental (`history`) — escolher o mais simples de
  manter **e justificar**.
- Tela de e-mail em Conversas: ao menos lista e leitura das threads relevantes.

## Fase 3 — Chamados GLPI (Disdal)

- API REST do GLPI, **somente leitura**. Trazer **apenas**: chamados atribuídos a mim +
  chamados novos (sem atendente). **Nunca** de outros atendentes.
- Uso: notificação no Prism (painel + área de notificações). Definir se chamado atribuído a mim
  vira card automático ou com um clique; nº do chamado como referência + link.
- Sincronização por agendamento (pg_cron + edge function a cada X min).
- **Verificar primeiro:** se o GLPI só é acessível pela rede interna, a edge function não
  alcança → propor coletor na VPS ou alternativa.

## Fase futura (estrutura pronta, não implementar)

- **Zoho** (chamados da Inko), na mesma estrutura de integrações.
- **Assistente vira agente**, agindo sobre demandas, conversas e conhecimento como ferramentas.

## Dívidas transversais

- [~] Infra de teste (ver [TESTING.md](TESTING.md)): Vitest + specs unitárias de
      `resolve-model` e `tags-to-labels` feitos; falta E2E (Playwright).
- [x] Linha Orvexa aplicada em `globals.css` (paleta/raio/fontes), primitivos
      (card/button/badge/input/dialog), shell (sidebar/topbar/page-header), Painel,
      Demandas e Configurações. Telas de Conhecimento/Finanças herdam os primitivos;
      ajuste fino módulo a módulo quando cada um for revisitado.
- [x] Guarda de segredo decidida: **Supabase Vault** (migration 0025), acessível só
      pela edge function `conectar`. A listagem devolve só `has_*`/status.
