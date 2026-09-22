-- Memória do assistente.
--
-- O que Hugo ensina numa conversa não pode morrer com ela. "A rotina 410 é o
-- controle de lock, tabela PCCONTROLELOCK", "Disdal e Inko são clientes",
-- "prefiro SQL em maiúsculas" — isso vale para todas as conversas seguintes.
--
-- Fica em tabela própria, e não em notes, porque o propósito é outro: nota é
-- conteúdo que Hugo lê; memória é contexto que o modelo recebe sem pedir, em
-- toda pergunta. Misturar as duas encheria o módulo de Notas de fragmentos que
-- só fazem sentido para a máquina.
--
-- `subject` é o assunto em uma ou duas palavras ("rotina 410", "clientes"),
-- usado para achar e para não duplicar. `content` é o fato em si.

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.memories enable row level security;

create policy "owner full access" on public.memories for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- O assunto é único: ensinar de novo sobre o mesmo tema atualiza o que existe
-- em vez de acumular versões contraditórias do mesmo fato.
create unique index memories_subject_idx on public.memories (lower(subject));
create index memories_updated_idx on public.memories (updated_at desc);
