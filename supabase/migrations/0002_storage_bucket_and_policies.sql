-- Bucket privado para arquivos e anexos, e políticas restritas ao dono.
-- NOTA: o e-mail usado aqui estava incorreto; ver 0003_fix_owner_email.sql.

insert into storage.buckets (id, name, public) values ('files', 'files', false);

create policy "owner full access" on public.tasks for all to authenticated
  using ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com') with check ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com');
create policy "owner full access" on public.attachments for all to authenticated
  using ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com') with check ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com');
create policy "owner full access" on public.snippets for all to authenticated
  using ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com') with check ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com');
create policy "owner full access" on public.notes for all to authenticated
  using ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com') with check ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com');
create policy "owner full access" on public.folders for all to authenticated
  using ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com') with check ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com');
create policy "owner full access" on public.files for all to authenticated
  using ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com') with check ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com');
create policy "owner full access" on public.bookmarks for all to authenticated
  using ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com') with check ((auth.jwt()->>'email') = 'hugosantoss1423@gmail.com');

create policy "owner read files" on storage.objects for select to authenticated
  using (bucket_id = 'files' and (auth.jwt()->>'email') = 'hugosantoss1423@gmail.com');
create policy "owner insert files" on storage.objects for insert to authenticated
  with check (bucket_id = 'files' and (auth.jwt()->>'email') = 'hugosantoss1423@gmail.com');
create policy "owner update files" on storage.objects for update to authenticated
  using (bucket_id = 'files' and (auth.jwt()->>'email') = 'hugosantoss1423@gmail.com');
create policy "owner delete files" on storage.objects for delete to authenticated
  using (bucket_id = 'files' and (auth.jwt()->>'email') = 'hugosantoss1423@gmail.com');
