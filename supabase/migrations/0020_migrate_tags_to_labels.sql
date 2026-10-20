-- Migração de dados: `tasks.tags` (text[]) -> `labels` + `task_labels`.
--
-- Idempotente de propósito, para poder reaplicar sem duplicar: cria cada
-- etiqueta distinta (ON CONFLICT no name_key não faz nada) e cada vínculo
-- (ON CONFLICT na PK composta não faz nada). A coluna `tags` NÃO é apagada
-- aqui — fica como rede de segurança até conferência; uma migration posterior
-- a remove. Nenhuma etiqueta é descartada.

-- 1) Cada tag distinta vira uma etiqueta (ignora vazios/whitespace).
insert into public.labels (name)
select distinct trim(tag)
from public.tasks, unnest(tags) as tag
where trim(tag) <> ''
on conflict (name_key) do nothing;

-- 2) Recria os vínculos casando pela chave normalizada da etiqueta.
insert into public.task_labels (task_id, label_id)
select t.id, l.id
from public.tasks t
cross join lateral unnest(t.tags) as tag
join public.labels l on l.name_key = lower(trim(tag))
where trim(tag) <> ''
on conflict (task_id, label_id) do nothing;
