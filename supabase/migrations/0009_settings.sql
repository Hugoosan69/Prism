-- Configuração do chat editável pela própria plataforma.
--
-- Até aqui provedor, modelo e chaves só existiam como variável de ambiente, e
-- trocar de modelo exigia commit e deploy. Agora ficam aqui, e as variáveis
-- viram o padrão de fábrica: o que está no banco vence, e o que estiver vazio
-- cai para a env. Assim o app continua subindo mesmo com a tabela vazia.
--
-- Linha única: `id` é boolean fixo em true com check, o jeito mais simples de
-- um singleton em Postgres — não existe "segunda configuração".

create table public.settings (
  id boolean primary key default true check (id),
  ai_base_url text not null default '',
  ai_model text not null default '',
  ai_api_key text not null default '',
  tavily_api_key text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "owner full access" on public.settings for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

insert into public.settings (id) values (true);
