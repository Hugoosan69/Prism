-- Relação N:N entre tarefas e etiquetas. A chave primária composta já impede
-- o mesmo vínculo duas vezes; o delete em cascata limpa os vínculos quando a
-- tarefa ou a etiqueta some.

create table public.task_labels (
  task_id uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, label_id)
);

create index task_labels_label_id on public.task_labels (label_id);

alter table public.task_labels enable row level security;

create policy "owner full access" on public.task_labels for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
