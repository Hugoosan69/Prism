-- As diretrizes do assistente, escritas por Hugo.
--
-- Já existiam duas fontes de comportamento: a personalidade de partida, que
-- mora no SYSTEM_PROMPT e só muda com commit, e as memórias do tipo `jeito`,
-- que o assistente propõe guardar quando é corrigido no meio de uma conversa.
--
-- Faltava a do meio: um texto que Hugo escreve e revisa quando quer, sem
-- depender de o assistente ter percebido a correção e sem precisar de deploy.
-- É a diretriz — o que ele é por decisão, não por dedução.
--
-- Fica em `settings` e não em `memories` porque é um texto só, editado inteiro,
-- e não uma lista de fatos independentes. E entra no prompt **depois** das
-- memórias de jeito: onde as duas discordarem, vale o que Hugo escreveu à mão.

alter table public.settings
  add column ai_instructions text not null default '';
