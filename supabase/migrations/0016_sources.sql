-- Origens: de onde a demanda veio (WhatsApp, E-mail, Chamado, Manual).
-- Editáveis, mas vêm sempre deste cadastro — o card referencia `source_id`,
-- nunca um texto solto. A origem usa ícone Lucide + tom neutro (DESIGN §2),
-- para não competir com a cor da empresa.
--
-- Os quatro são semeados aqui. `slug` é estável para o código reconhecer a
-- origem (ex.: o webhook do WhatsApp casa pela origem de slug 'whatsapp'),
-- enquanto `name` é editável para exibição.

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text not null default 'Inbox',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sources enable row level security;

create policy "owner full access" on public.sources for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

insert into public.sources (slug, name, icon, position) values
  ('whatsapp', 'WhatsApp', 'MessageCircle', 0),
  ('email',    'E-mail',   'Mail',          1),
  ('ticket',   'Chamado',  'LifeBuoy',      2),
  ('manual',   'Manual',   'PencilLine',    3);
