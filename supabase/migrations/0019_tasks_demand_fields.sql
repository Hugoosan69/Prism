-- A tarefa vira demanda: ganha empresa, origem, referência externa e o
-- contexto capturado (ex.: últimas mensagens da conversa).
--
-- `external_type`/`external_id`/`external_url` guardam de onde a demanda veio
-- (conversa do WhatsApp, thread do Gmail, nº do chamado) e alimentam o botão
-- "abrir origem" no card. Tudo nullable: a tarefa manual segue sem origem.
--
-- `company_id`/`source_id` usam ON DELETE SET NULL: apagar uma empresa ou
-- origem não pode apagar a tarefa. A coluna `tags` continua aqui de propósito —
-- a migração 0020 a copia para `labels` e só uma migration posterior a remove,
-- depois de conferência. Nada se perde.

alter table public.tasks
  add column company_id uuid references public.companies(id) on delete set null,
  add column source_id uuid references public.sources(id) on delete set null,
  add column external_type text,
  add column external_id text,
  add column external_url text,
  add column context text not null default '';

create index tasks_company_id on public.tasks (company_id);
create index tasks_source_id on public.tasks (source_id);
