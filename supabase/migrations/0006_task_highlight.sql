-- Destaque manual de tarefa no Kanban.
--
-- Marca uma tarefa para chamar atenção no quadro (estrela + borda âmbar) sem
-- alterar a coluna nem a posição — ortogonal à prioridade (low/medium/high) e
-- à ordem de urgência, que é a própria posição na coluna.

alter table public.tasks
  add column if not exists highlighted boolean not null default false;
