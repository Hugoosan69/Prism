-- Novo estágio "Aguardando" no Kanban.
--
-- Cobre a tarefa que já foi feita da sua parte mas depende de validação ou
-- retorno de outra pessoa: sai do que você precisa tocar, sem virar concluída.
-- Só 'done' grava completed_at, então o "Concluídas hoje" do dashboard segue
-- contando apenas o que foi de fato encerrado.

alter table public.tasks drop constraint tasks_status_check;

alter table public.tasks add constraint tasks_status_check
  check (status in ('todo','doing','waiting','done'));
