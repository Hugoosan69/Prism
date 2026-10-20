-- Integrações: tabela própria (não colunas soltas em settings), com status e
-- vínculo opcional com empresa. Base para "testar conexão" (Bloco 5) e para as
-- Fases 1-3 (WAHA, Gmail, GLPI, Zoho).
--
-- SEGREDO NUNCA NO FRONT: a credencial não é coluna desta tabela. Ela mora no
-- Supabase Vault (cifrada, fora dos schemas expostos pelo PostgREST) e só a
-- edge function a lê pelo nome em `secret_name`. A listagem devolve apenas
-- `has_secret` e `status` — o front nunca vê o valor. `config` guarda só o que
-- não é segredo (URL, nome da sessão, marcador do Gmail, etc.).

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('waha', 'gmail', 'glpi', 'zoho')),
  label text not null default '',
  company_id uuid references public.companies(id) on delete set null,
  status text not null default 'disconnected'
    check (status in ('disconnected', 'connected', 'error', 'pending')),
  config jsonb not null default '{}'::jsonb,
  has_secret boolean not null default false,
  secret_name text,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.integrations enable row level security;

create policy "owner full access" on public.integrations for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
