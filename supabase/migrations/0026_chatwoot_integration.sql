-- Adicionar 'chatwoot' como tipo válido de integração.
alter table public.integrations
  drop constraint integrations_type_check,
  add constraint integrations_type_check
    check (type in ('waha', 'gmail', 'glpi', 'zoho', 'chatwoot'));
