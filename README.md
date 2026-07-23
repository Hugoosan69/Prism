# Prism

Organizador pessoal: Kanban, biblioteca SQL, arquivos, notas, favoritos e pesquisa global em um só lugar. Uso individual.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres + Auth + Storage)

## Rodando localmente

```bash
npm install
npm run dev
```

Requer `.env.local` com:

```
NEXT_PUBLIC_SUPABASE_URL=https://ukewaugpbrorabmeptip.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave publishable do projeto>
```

## Setup do Supabase (feito uma única vez)

1. Projeto "Prism" na região `sa-east-1`.
2. Aplicar `supabase/migrations/*.sql` em ordem no SQL Editor (tabelas: tasks, attachments, snippets, notes, folders, files, bookmarks; bucket privado `files`).
3. RLS: todas as tabelas e o storage restritos ao dono pela função `public.is_owner()`, hoje `hugoosan69@gmail.com`. Para trocar de conta, alterar só essa função.
4. Criar o usuário no Dashboard (Authentication → Users → Add user, com auto-confirm) e desabilitar signups públicos (Authentication → Sign In / Up → desmarcar "Allow new users to sign up").

## Deploy (Vercel)

Importar este repositório na Vercel e definir as duas variáveis de ambiente acima. Nenhuma configuração extra é necessária.
