-- Ação direta: o assistente grava sem passar pelo card.
--
-- Hugo pediu isso três vezes, e por três vezes a resposta foi a mesma: a
-- ferramenta de escrita não executa, então nenhuma instrução dele podia
-- funcionar. O efeito colateral era pior que a recusa — o modelo lia a ordem,
-- respondia "incluí na nota" e o que aparecia era um card. A arquitetura fazia
-- ele parecer mentiroso.
--
-- O motivo do card continua verdadeiro: as ferramentas de leitura trazem texto
-- que **outra pessoa escreveu** (página da web, nota do cofre), e escrita
-- automática transformaria uma frase plantada lá em comando. Mas isso não vale
-- para toda conversa — vale para as que tocaram fonte externa.
--
-- Daí o desenho: liga-se a ação direta, e ela vale **só enquanto a rodada não
-- tiver lido web nem cofre**. Tocou fonte externa, volta o card, naquela
-- resposta. Autonomia com escopo pela origem do dado, em vez de um interruptor
-- que desliga a proteção inteira.
--
-- É `boolean` e não texto de instrução de propósito: comportamento com
-- consequência de segurança não se infere de frase em linguagem natural.

alter table public.settings
  add column acao_direta boolean not null default false;
