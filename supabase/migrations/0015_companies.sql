-- Empresas: a central de demandas agrupa trabalho por empresa (Disdal, Inko,
-- Pessoal...). Cada empresa tem cor própria (ponto/trilha do card, cabeçalho de
-- coluna, filtro) e um expediente, para o Painel saber o que caiu fora de hora.
--
-- `is_default` marca a empresa dos itens sem empresa. O índice parcial único
-- garante que só exista uma padrão — trocar a padrão é mover a flag, não abrir
-- espaço para duas respostas.
--
-- Nada de campo livre em outras tabelas: empresa sempre vem daqui.

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#7c6cff',
  work_start time,
  work_end time,
  is_default boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index companies_single_default
  on public.companies (is_default)
  where is_default;

alter table public.companies enable row level security;

create policy "owner full access" on public.companies for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
