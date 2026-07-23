-- Corrige o e-mail do dono e centraliza a regra.
--
-- O e-mail estava repetido em 11 políticas (7 tabelas + 4 do storage) e havia
-- sido escrito errado. Passando por uma função, trocar o dono vira uma
-- alteração de uma linha só, e o erro não pode voltar por divergência entre
-- as políticas.

create or replace function public.is_owner()
returns boolean
language sql
stable
set search_path = ''
as $$
  select (auth.jwt()->>'email') = 'hugoosan69@gmail.com'
$$;

-- Tabelas
drop policy if exists "owner full access" on public.tasks;
drop policy if exists "owner full access" on public.attachments;
drop policy if exists "owner full access" on public.snippets;
drop policy if exists "owner full access" on public.notes;
drop policy if exists "owner full access" on public.folders;
drop policy if exists "owner full access" on public.files;
drop policy if exists "owner full access" on public.bookmarks;

create policy "owner full access" on public.tasks for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owner full access" on public.attachments for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owner full access" on public.snippets for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owner full access" on public.notes for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owner full access" on public.folders for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owner full access" on public.files for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "owner full access" on public.bookmarks for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- Storage (bucket privado "files")
drop policy if exists "owner read files" on storage.objects;
drop policy if exists "owner insert files" on storage.objects;
drop policy if exists "owner update files" on storage.objects;
drop policy if exists "owner delete files" on storage.objects;

create policy "owner read files" on storage.objects for select to authenticated
  using (bucket_id = 'files' and public.is_owner());
create policy "owner insert files" on storage.objects for insert to authenticated
  with check (bucket_id = 'files' and public.is_owner());
create policy "owner update files" on storage.objects for update to authenticated
  using (bucket_id = 'files' and public.is_owner());
create policy "owner delete files" on storage.objects for delete to authenticated
  using (bucket_id = 'files' and public.is_owner());
