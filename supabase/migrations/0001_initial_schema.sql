-- Schema inicial do Prism.

-- Kanban
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo','doing','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  due_date date,
  tags text[] not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  name text not null,
  storage_path text not null,
  size bigint not null default 0,
  mime_type text not null default '',
  created_at timestamptz not null default now()
);

-- Biblioteca SQL
create table public.snippets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default '',
  tags text[] not null default '{}',
  code text not null default '',
  is_favorite boolean not null default false,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notas
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content text not null default '',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Arquivos
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.folders(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.folders(id) on delete set null,
  name text not null,
  storage_path text not null,
  size bigint not null default 0,
  mime_type text not null default '',
  created_at timestamptz not null default now()
);

-- Favoritos (links)
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text not null default '',
  category text not null default '',
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
alter table public.attachments enable row level security;
alter table public.snippets enable row level security;
alter table public.notes enable row level security;
alter table public.folders enable row level security;
alter table public.files enable row level security;
alter table public.bookmarks enable row level security;
