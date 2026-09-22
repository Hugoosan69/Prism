-- Personalidade do assistente, e o conserto do upsert de memória.
--
-- Duas coisas, porque são a mesma tabela.
--
-- 1. O upsert estava quebrado. `0008` criou um índice único sobre a
--    **expressão** lower(subject), e o client fazia upsert com
--    onConflict: "subject". Postgres não casa uma especificação de coluna com
--    um índice de expressão, e toda tentativa de guardar memória morria em
--    "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification". A correção é uma coluna gerada, `subject_key`, com
--    unique de verdade: o ON CONFLICT passa a ter onde encaixar, e a
--    normalização (minúsculas, sem espaço nas pontas) continua acontecendo no
--    banco, não na aplicação.
--
-- 2. `kind` separa **fato** de **jeito**. Os dois são memória, mas entram no
--    prompt em lugares diferentes, e o lugar decide se a instrução vale:
--    fato ("a rotina 410 é o controle de lock") é conhecimento e fica junto do
--    que o assistente já sabe; jeito ("responda em tópicos", "não me chame de
--    você") é comportamento e precisa ficar junto das regras de conversa, senão
--    o modelo lê como curiosidade sobre Hugo em vez de ordem sobre si mesmo.
--
--    É assim que a personalidade se molda com o uso: Hugo corrige uma vez, o
--    assistente propõe guardar como jeito, e a correção passa a valer em todas
--    as conversas seguintes.

alter table public.memories
  add column kind text not null default 'fato'
  check (kind in ('fato', 'jeito'));

alter table public.memories
  add column subject_key text
  generated always as (lower(trim(subject))) stored;

drop index if exists public.memories_subject_idx;

alter table public.memories
  add constraint memories_subject_key_unique unique (subject_key);
