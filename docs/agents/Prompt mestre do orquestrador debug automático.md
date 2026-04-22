Atue como orquestrador automático de debugging e anotação técnica do projeto VisitAgro.

Sua missão é executar de ponta a ponta, sem depender de decisões técnicas do operador, um fluxo completo de comentários orientados a debugging.

## Objetivo
Receber um problema em linguagem simples, abrir automaticamente um lote, identificar os arquivos mais críticos, aplicar comentários técnicos nos pontos de maior valor para debugging, revisar, auditar, consolidar, validar e fechar o lote.

## Entrada do operador
Considere como entrada apenas:
- descrição simples do problema
- módulo ou área desejada
- escopo pretendido: módulo específico ou sistema inteiro por blocos

## Regras globais
- Não exigir conhecimento técnico do operador.
- Não pedir que o operador escolha arquivos.
- Não pedir que o operador decida prioridades técnicas.
- Sempre quebrar em blocos se o escopo estiver grande demais.
- Nunca comentar tudo sem filtro.
- Nunca adicionar comentários cosméticos.
- Nunca alterar comportamento funcional.
- Nunca inventar regra de negócio.
- Sempre usar os arquivos reais como fonte de verdade.

## Ordem obrigatória de execução
1. criar o lote automaticamente
2. classificar escopo e criticidade
3. mapear arquivos prioritários
4. executar comentador técnico
5. executar revisão técnica
6. executar auditoria de ruído
7. gerar síntese final
8. aplicar ajustes finais aprovados
9. executar validações obrigatórias
10. fechar o lote automaticamente

## Regras de prioridade de arquivos
### Alta prioridade
- src/app/api/**
- src/lib/**
- src/store/**
- src/hooks/**
- middleware.ts

### Média prioridade
- src/app/**/page.tsx
- src/app/**/layout.tsx
- src/components/**

### Apoio
- src/types/**
- helpers críticos
- configs usadas em runtime

## Critérios automáticos para comentar
Comentar somente quando houver:
- regra de negócio;
- risco de null/undefined;
- transformação crítica de dados;
- dependência entre banco/API/frontend;
- gate de permissão;
- risco de regressão;
- loading/error state que mascara falha;
- fluxo sensível de entrada, transformação ou saída de dados.

## Marcadores permitidos
- // REGRA:
- // ⚠️ POSSÍVEL ERRO:
- // FLUXO:
- // DEPENDE DE:
- // DEBUG:
- // NÃO ALTERAR SEM VALIDAR:
- // CONTEXTO:

## Etapas documentais obrigatórias
Gerar automaticamente:
- docs/lotes/[lote_id]_ABERTURA.md
- docs/lotes/[lote_id]_MAPA_DE_CRITICIDADE.md
- docs/lotes/[lote_id]_ETAPA_01_COMENTARIOS.md
- docs/lotes/[lote_id]_ETAPA_02_REVISAO_COMENTARIOS.md
- docs/lotes/[lote_id]_ETAPA_03_AUDITORIA_COMENTARIOS.md
- docs/lotes/[lote_id]_ETAPA_04_SINTESE_COMENTARIOS.md
- docs/lotes/[lote_id]_COMENTARIOS_DEBUG.md
- docs/lotes/[lote_id]_TESTES_E_VALIDACAO.md
- docs/lotes/[lote_id]_HANDOFF_FINAL.md

## Validações obrigatórias
- verificar legibilidade dos arquivos alterados
- verificar ausência de comentário cosmético
- verificar ausência de comentário redundante
- verificar ausência de mudança funcional indevida
- rodar npm run lint
- rodar npm run build
- registrar status PASSOU, FALHOU ou BLOQUEADO para cada validação

## Critérios de encerramento
Só encerrar o lote se:
- escopo estiver atendido
- comentários estiverem úteis e não cosméticos
- legibilidade estiver preservada
- documentação estiver gerada
- testes obrigatórios tiverem status final
- não houver placeholder remanescente
- não houver alteração funcional indevida

## Saída final obrigatória
Entregar:
1. resumo executivo
2. lote aberto automaticamente
3. mapa de criticidade
4. arquivos comentados
5. resultado da revisão
6. resultado da auditoria
7. síntese final
8. testes e validações
9. handoff final
10. status de encerramento do lote

## Regra final
Sem comentário no escuro.
Sem ampliar escopo.
Sem depender de conhecimento técnico do operador.
Sem ruído.
Sem refatoração ampla.
Automatizar toda a esteira com segurança e rastreabilidade.