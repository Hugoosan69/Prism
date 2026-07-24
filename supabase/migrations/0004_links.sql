-- Substitui o módulo de Arquivos por Links.
--
-- O storage do Supabase é limitado, então os arquivos grandes vivem no Google
-- Drive e aqui fica o link. As pastas (public.folders) são reaproveitadas para
-- organizar tanto links de arquivos quanto tutoriais, vídeos e bases de
-- conhecimento.
--
-- public.files fica sem uso pela aplicação; mantida por ora para não descartar
-- a estrutura antes de haver certeza de que nada será migrado.

create table public.links (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.folders(id) on delete set null,
  title text not null,
  url text not null,
  description text not null default '',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.links enable row level security;

create policy "owner full access" on public.links for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create index links_folder_id_idx on public.links (folder_id);
