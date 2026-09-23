-- Credenciais do cofre saem da variável de ambiente para o banco.
--
-- A decisão anterior (0009) foi deixar as `GOOGLE_*` só em env, com o
-- argumento de que trocá-las exige refazer o consentimento OAuth e portanto
-- não é ajuste de rotina. O argumento estava certo e a conclusão errada.
--
-- Em 23/09/2026 o ambiente parou de chegar ao processo em produção, e o efeito
-- foi o cofre e a busca na web se desligarem sozinhos. A web voltou pela tela,
-- porque a chave da Tavily já morava em `settings`. O cofre não tinha esse
-- caminho: a única forma de religá-lo era mexer no deploy.
--
-- A lição não é sobre o Google, é sobre dependência única: **toda credencial
-- de que um recurso depende precisa de pelo menos um caminho que não passe
-- pelo deploy.** Aqui vale a mesma regra do resto — banco vence, env é padrão
-- de fábrica.
--
-- Os nomes evitam repetir os da env de propósito, para ninguém confundir a
-- coluna com a variável ao ler uma query solta.

alter table public.settings
  add column drive_app_id text not null default '';

alter table public.settings
  add column drive_app_secret text not null default '';

alter table public.settings
  add column drive_renewal text not null default '';

alter table public.settings
  add column drive_folder text not null default '';
