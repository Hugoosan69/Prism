-- Modelos de IA: registro de modelos editável pela plataforma. Generaliza o que
-- hoje são colunas únicas em `settings` (ai_base_url/ai_model/ai_api_key) para
-- vários modelos, mantendo o `fetch` puro de lib/ai/client.ts e endpoints
-- compatíveis com OpenAI de cada provedor.
--
-- `dialect` cobre as exceções: ex. a série 5 da OpenAI usa
-- `max_completion_tokens` no lugar de `max_tokens`. Default 'openai'.
--
-- A CHAVE NÃO É COLUNA: como nas integrações, mora no Vault e a edge function a
-- lê por `key_secret_name`. A listagem devolve só `has_key`/status.

create table public.ai_models (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  provider text not null default '',
  model text not null,
  base_url text not null,
  dialect text not null default 'openai',
  status text not null default 'untested'
    check (status in ('untested', 'ok', 'error')),
  has_key boolean not null default false,
  key_secret_name text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_models enable row level security;

create policy "owner full access" on public.ai_models for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
