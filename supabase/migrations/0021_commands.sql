-- Comandos: o construtor "gatilho -> ação -> padrões". Só estrutura + CRUD
-- nesta fase; a execução (no webhook do WhatsApp) é a Fase 1.
--
-- Os padrões (empresa/prioridade/coluna/etiquetas) moram num jsonb `defaults`
-- em vez de uma coluna por campo: o conjunto de padrões ainda vai crescer e
-- não quero uma migration a cada novo padrão. As flags de comportamento
-- (apagar a mensagem do comando, mandar confirmação) são colunas próprias
-- porque são decisão de execução, não dado de preenchimento.

create table public.commands (
  id uuid primary key default gen_random_uuid(),
  trigger text not null,
  action text not null check (action in (
    'create_card', 'close_card', 'create_reminder', 'label_conversation'
  )),
  defaults jsonb not null default '{}'::jsonb,
  delete_message boolean not null default false,
  send_confirmation boolean not null default false,
  enabled boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index commands_trigger_unique on public.commands (lower(trim(trigger)));

alter table public.commands enable row level security;

create policy "owner full access" on public.commands for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
