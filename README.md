# Prism

Organizador pessoal: chat de IA, Kanban, biblioteca SQL, links, notas, favoritos e pesquisa global em um só lugar. Uso individual.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres + Auth + Storage)

## Rodando localmente

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local`. As duas variáveis do Supabase são opcionais (há padrão
no código); `NVIDIA_API_KEY` é o que liga o chat, e sem ela a tela abre desligada em vez de quebrar.

O chat lê o cofre Obsidian pela API do Google Drive. Para ligar essa parte, rode uma vez
`node scripts/drive-auth.mjs`: ele abre o consentimento do Google e imprime o refresh token.

## Setup do Supabase (feito uma única vez)

1. Projeto "Prism" no Supabase (hoje `asdjbedpqowzdppboxyy`, us-east-1).
2. Aplicar `supabase/migrations/*.sql` em ordem no SQL Editor (tabelas: tasks, attachments, snippets, notes, folders, files, bookmarks; bucket privado `files`).
3. RLS: todas as tabelas e o storage restritos ao dono pela função `public.is_owner()`, que compara com o e-mail da conta dona. O endereço real **não** fica no repositório (público): as migrations trazem `dono@exemplo.com` como placeholder. Para trocar de conta, alterar só essa função.
4. Criar o usuário no Dashboard (Authentication → Users → Add user, com auto-confirm) e desabilitar signups públicos (Authentication → Sign In / Up → desmarcar "Allow new users to sign up").

## Deploy (Vercel)

Importar este repositório na Vercel e definir as duas variáveis de ambiente acima. Nenhuma configuração extra é necessária.
