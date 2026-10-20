# Prism — Repaginação e Central de Demandas

## Contexto

O Prism é meu app pessoal, uma espécie de "Jarvis" (ainda sem a parte de agente). Uso tudo o que existe nele hoje: tarefas (kanban), notas, snippets, links, pastas/arquivos, bookmarks, finanças (despesas, pagamentos, receitas), chat com IA e memórias.

Trabalho em dois lugares prestando suporte ao ERP WinThor:
- **Disdal** (CLT): chamados no **GLPI**
- **Inko** (PJ): chamados no **Zoho** (fase futura)

As demandas chegam por WhatsApp, Gmail (mais de uma conta) e painéis de chamado. Muitas se perdem ou ficam para fora do expediente porque o kanban não enxerga essas origens. O objetivo é transformar o Prism numa **central de demandas**, onde tudo que é trabalho vira card e nada se perde. Ao mesmo tempo, quero **repaginar o sistema inteiro**, mantendo todas as funcionalidades atuais, mas organizadas de forma mais produtiva.

## Regras gerais para você (agente)

1. **Leia o código e o banco atual antes de propor qualquer coisa.** Banco: Supabase do Prism (tabelas `tasks`, `notes`, `snippets`, `links`, `folders`, `files`, `attachments`, `bookmarks`, `chat_threads`, `chat_messages`, `memories`, `settings`, `expenses`, `expense_payments`, `incomes`).
2. **Não perca dados existentes.** Toda mudança de schema via migration, com migração dos dados atuais (ex.: `tasks.tags` atuais → nova tabela de etiquetas).
3. Mantenha RLS em todas as tabelas novas.
4. Trabalhe **por fases** (abaixo). Antes de cada fase, me apresente o plano (tabelas, telas, funções) e espere meu OK.
5. **Nada de campo livre** para empresa, origem, etiqueta ou comando: tudo vem de cadastros nas Configurações.
6. Segredos (tokens, senhas, OAuth) não podem ficar legíveis pelo front. Use Supabase Vault ou equivalente, acessados só pelas edge functions.

## Fase 0 — Repaginação e Configurações

### Nova organização (sugestão; adapte depois de ler o código)
- **Painel** (página inicial): resumo do dia, o que está aberto por empresa, chamados novos, demandas atrasadas, destaques. O resumo diário fica **só aqui**, sem envio por WhatsApp.
- **Demandas**: o kanban, com filtros por empresa, origem, etiqueta e prioridade.
- **Conversas**: WhatsApp e Gmail (fases 1 e 2).
- **Conhecimento**: notas, snippets, links, bookmarks, pastas/arquivos.
- **Finanças**: despesas, pagamentos, receitas.
- **Assistente**: chat com IA e memórias. Deixe a arquitetura pronta para, no futuro, o assistente virar agente com acesso às demandas e conversas como ferramentas.
- **Configurações**.

### Configurações (cadastros)
- **Empresas**: nome, cor, horário de expediente, padrão para itens sem empresa. Ex.: Disdal, Inko, Pessoal.
- **Origens**: WhatsApp, E-mail, Chamado, Manual (editáveis).
- **Etiquetas**: nome, cor, opcionalmente vinculadas a uma empresa. Usadas em cards e conversas.
- **Comandos** (construtor): gatilho (ex.: `/d`, `/d!`, `/ok`, `/lembrar`), ação (criar card, fechar card da conversa, criar lembrete, etiquetar conversa), valores padrão (empresa, prioridade, coluna, etiquetas), e opções como "apagar a mensagem do comando após executar" e "enviar confirmação no meu chat comigo mesmo".
- **Integrações**: cada uma com tipo, credenciais, status de conexão e vínculo com uma empresa: WAHA, contas Gmail (várias), GLPI e, no futuro, Zoho.

### Tarefas (cards)
Adicionar à `tasks`: `company_id`, `source_id`, referência externa (tipo + id + URL, ex.: id da conversa do WhatsApp, id da thread do Gmail, nº do chamado GLPI), relação com etiquetas (substituindo `tags` texto) e contexto capturado (ex.: últimas mensagens da conversa). No card, um botão "abrir origem" leva direto à conversa, ao e-mail ou ao chamado.

## Fase 1 — WhatsApp (WAHA)

- O WAHA **já roda na minha VPS** (a mesma do projeto CRM). Configuração da sessão nas Integrações (URL, API key, nome da sessão).
- Edge function de **webhook** recebendo eventos do WAHA, protegida por segredo/HMAC. Assinar **`message.any`** (não só `message`), para receber também as mensagens que eu envio, que é onde estão os comandos.
- Tabelas novas e separadas do chat de IA: contatos, conversas, mensagens (ex.: `wa_contacts`, `wa_chats`, `wa_messages`).
- **Tela de conversas** no Prism: lista de chats, leitura e resposta (envio via API do WAHA), etiquetas por conversa, vínculo da conversa com empresa (pelo contato), indicação de cards abertos ligados à conversa.
- **Grupos**: configuração para separar, silenciar ou só destacar quando eu for mencionado, para não enterrar conversas privadas.
- **Comandos**: no webhook, se a mensagem for minha (`fromMe`) e começar com um gatilho cadastrado, executar a ação configurada. Se o comando for resposta citando outra mensagem, a mensagem citada vira a descrição do card. Guardar no card a referência da conversa e as últimas N mensagens como contexto.

## Fase 2 — Gmail (múltiplas contas)

- Conexão via **API do Gmail com OAuth**, uma ou mais contas, cada uma vinculada a uma empresa. Verifique se dá para reaproveitar o app OAuth do Google que já existe nas configurações (`drive_app_id`/`drive_app_secret`).
- Um **marcador configurável** por conta (ex.: "Demanda") transforma o e-mail em card, com assunto, remetente, trecho e link para a thread.
- Sincronização por push (Pub/Sub) ou polling incremental (`history`); escolha o mais simples de manter e me justifique.
- Tela de e-mail dentro de Conversas: pelo menos lista e leitura das threads relevantes.

## Fase 3 — Chamados GLPI (Disdal)

- Integração via **API REST do GLPI**, somente leitura.
- Trazer **apenas**:
  - chamados **atribuídos a mim**;
  - chamados **novos** (ainda sem atendente).
  - **Nunca** trazer chamados vinculados a outros atendentes.
- Uso: **notificação** no Prism (painel e área de notificações). Proponha como os chamados atribuídos a mim viram cards (automático ou com um clique "virar demanda"), com o nº do chamado como referência e link para o GLPI.
- Sincronização por agendamento (ex.: pg_cron + edge function a cada X minutos).
- **Verificar primeiro:** se o GLPI só é acessível pela rede interna da empresa, a edge function não vai alcançar. Nesse caso, proponha um coletor rodando na VPS ou outra alternativa.

## Fase futura (não implementar agora, mas deixar a estrutura pronta)

- **Zoho** (chamados da Inko), usando a mesma estrutura de integrações.
- **Agente**: o Assistente agindo sobre demandas, conversas e conhecimento.

## Entrega esperada agora

1. Um diagnóstico rápido do código e do banco atual.
2. O plano da **Fase 0** (estrutura de navegação, telas, migrations e migração dos dados existentes) para eu aprovar antes de você começar.
