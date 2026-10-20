-- Guarda de segredo das integrações e modelos: Supabase Vault.
--
-- Decisão (questão aberta do diagnóstico): segredo cifrado no banco, acessível
-- só por edge function, nunca legível pelo front. O Vault cifra em repouso e
-- vive fora dos schemas expostos pelo PostgREST. Estes dois wrappers são a
-- única porta: `security definer` para alcançar o schema vault, e com EXECUTE
-- revogado de anon/authenticated e concedido só ao service_role — ou seja, só
-- a edge function (que roda com a service key) chama. O front jamais lê o valor;
-- vê apenas `has_secret`/`has_key` nas tabelas.

create or replace function public.app_set_secret(p_name text, p_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing uuid;
begin
  select id into existing from vault.secrets where name = p_name;
  if existing is not null then
    perform vault.update_secret(existing, p_secret, p_name);
  else
    perform vault.create_secret(p_secret, p_name);
  end if;
end;
$$;

create or replace function public.app_get_secret(p_name text)
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = p_name;
$$;

revoke all on function public.app_set_secret(text, text) from public, anon, authenticated;
revoke all on function public.app_get_secret(text) from public, anon, authenticated;
grant execute on function public.app_set_secret(text, text) to service_role;
grant execute on function public.app_get_secret(text) to service_role;
