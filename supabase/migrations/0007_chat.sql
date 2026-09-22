-- Chat de IA como tela inicial do Prism.
--
-- A conversa é conhecimento como qualquer outro módulo: fica no banco, entra na
-- pesquisa global e sobrevive ao fechar a aba. Duas tabelas em vez de um JSON
-- por conversa porque a mensagem é a unidade que se busca e se pagina.
--
-- chat_messages.role segue a nomenclatura da API (user/assistant/tool) para o
-- histórico poder ser remontado e reenviado ao modelo sem tradução.
--
-- reasoning guarda o reasoning_content que o Nemotron devolve quando
-- enable_thinking está ligado; fica separado do content porque não faz parte da
-- resposta e não deve voltar para o modelo no turno seguinte.
--
-- tool_calls e tool_call_id preservam o ciclo de ferramenta (o modelo pede, o
-- servidor executa, o resultado volta). Sem eles o histórico remontado fica
-- inválido para a API na primeira pergunta de continuação.

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant','tool')),
  content text not null default '',
  reasoning text not null default '',
  tool_calls jsonb,
  tool_call_id text,
  created_at timestamptz not null default now()
);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

create policy "owner full access" on public.chat_threads for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owner full access" on public.chat_messages for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create index chat_messages_thread_idx
  on public.chat_messages (thread_id, created_at);
create index chat_threads_updated_idx
  on public.chat_threads (updated_at desc);
