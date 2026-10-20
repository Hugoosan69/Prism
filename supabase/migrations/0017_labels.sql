-- Etiquetas: substituem o `tasks.tags text[]`. Têm cor própria (pill discreta,
-- DESIGN §2) e vínculo opcional a uma empresa. Vêm sempre deste cadastro.
--
-- `name_key` é coluna gerada (lower(trim(name))) e carrega o unique, mesmo
-- padrão de `memories.subject_key`: o ON CONFLICT da migração de dados precisa
-- casar com um índice existente, senão é erro em runtime. Assim "Disdal" e
-- "disdal" não viram duas etiquetas.

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text generated always as (lower(trim(name))) stored unique,
  color text not null default '#7c6cff',
  company_id uuid references public.companies(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.labels enable row level security;

create policy "owner full access" on public.labels for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
