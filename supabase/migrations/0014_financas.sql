-- Módulo Finanças: substitui a planilha "Controle Financeiro".
--
-- A planilha tinha uma grade despesa × mês marcada com "ok". O que ela não
-- conseguia dizer era *quanto* foi pago num mês específico, nem distinguir uma
-- conta que se repete de uma parcela que acaba. Daí o desenho em três tabelas.
--
-- **Por que o pagamento é linha e não coluna:** marcar como pago é o gesto mais
-- frequente do módulo e precisa ser um clique. Uma linha em expense_payments é
-- um insert; desmarcar é um delete. Se o mês fosse coluna da despesa, cada
-- marcação viraria um update de uma estrutura larga, e doze meses por despesa
-- virariam doze colunas mortas em janeiro.
--
-- **Por que a recorrência não gera linhas:** uma despesa mensal não cria 12
-- registros por ano. Ela tem `start_month` e a aplicação projeta em que meses
-- aparece (`lib/financas.ts`). Gerar linhas obrigaria a decidir até quando
-- gerar, e a corrigir o passado toda vez que o valor mudasse.
--
-- **amount_paid existe para congelar o passado.** Ele é nullable e, em tese,
-- null significa "usa o valor atual da despesa". Na prática a aplicação sempre
-- grava o valor vigente no momento da marcação: sem isso, reajustar o aluguel
-- reescreveria o histórico de todos os meses já pagos — a planilha não fazia
-- isso e seria uma regressão silenciosa.

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric(12, 2) not null default 0,
  -- fixa = o valor não muda mês a mês; variavel = muda (luz, mercado).
  kind text not null default 'fixa' check (kind in ('fixa', 'variavel')),
  recurrence text not null default 'mensal'
    check (recurrence in ('mensal', 'parcelada', 'unica')),
  -- Sempre o primeiro dia do mês: o módulo raciocina em meses, não em datas.
  start_month date not null,
  installments_total int check (installments_total is null or installments_total > 0),
  notes text not null default '',
  -- Desativar preserva o histórico de pagamentos; apagar levaria tudo junto.
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Nº de parcelas só faz sentido em parcelada, e nela é obrigatório.
  constraint parcelas_coerentes check (
    (recurrence = 'parcelada' and installments_total is not null)
    or (recurrence <> 'parcelada' and installments_total is null)
  )
);

create table public.expense_payments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  month date not null,
  amount_paid numeric(12, 2),
  paid_at timestamptz not null default now(),
  -- Um pagamento por despesa por mês: é o que torna o toggle idempotente.
  unique (expense_id, month)
);

create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric(12, 2) not null default 0,
  -- Em recorrente, `month` é o mês de **início**, igual a expenses.start_month:
  -- um salário lançado em outubro não deve aparecer em janeiro retroativo.
  month date not null,
  recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;
alter table public.expense_payments enable row level security;
alter table public.incomes enable row level security;

create policy "owner full access" on public.expenses for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owner full access" on public.expense_payments for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owner full access" on public.incomes for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- A tela sempre pergunta "o que existe neste mês": os índices seguem isso.
create index expenses_start_month_idx on public.expenses (start_month);
create index expense_payments_month_idx on public.expense_payments (month);
create index expense_payments_expense_idx on public.expense_payments (expense_id);
create index incomes_month_idx on public.incomes (month);
