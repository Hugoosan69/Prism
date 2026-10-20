-- Atribuição de modelo por superfície: um modelo para o chat, outro para o
-- Gmail, outro para os chamados. `surface` é único (uma atribuição por
-- superfície); apagar o modelo zera a atribuição (SET NULL) em vez de sumir
-- com a linha, para a superfície cair no padrão de fábrica.

create table public.ai_assignments (
  surface text primary key check (surface in ('chat', 'gmail', 'chamados')),
  model_id uuid references public.ai_models(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.ai_assignments enable row level security;

create policy "owner full access" on public.ai_assignments for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
