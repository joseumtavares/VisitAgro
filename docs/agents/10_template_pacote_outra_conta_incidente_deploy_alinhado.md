# Template — Pacote obrigatório para outra conta em incidente de deploy

```md
# [lote_id] Pacote obrigatório — incidente de deploy para outra conta

## 1. Identificação
- lote_id:
- título:
- tipo do incidente:
- prioridade:
- ambiente afetado:
- branch base:
- commit/hash de referência:
- data/hora da falha:
- responsável pelo envio:
- conta/origem:
- conta/destino:

## 2. Resumo executivo do incidente
- comportamento esperado antes da falha:
- comportamento observado:
- etapa da falha:
- impacto atual no sistema:
- hipótese inicial já levantada:
- status do deploy:
- existe rollback disponível?:

## 3. Escopo do lote que originou o incidente
- objetivo funcional do lote:
- escopo incluído:
- fora de escopo:
- definição de pronto original:
- definição de não regressão:
- arquivos de alta sensibilidade:
- arquivos que NÃO devem ser reabertos sem evidência forte:

## 4. Estado atual do lote
- o que já foi feito:
- o que já foi validado:
- o que ficou pendente:
- o que não deve ser refeito:
- o que já estava aprovado:
- se houve reabertura parcial, explicar:

## 5. Evidências obrigatórias anexadas
- log de build:
- log de runtime:
- log de migration/SQL:
- log de lint:
- log de typecheck:
- screenshots:
- links do deploy:
- diff real do lote:
- before/after:
- comandos executados antes da falha:
- stack trace principal:

## 6. Arquivos tocados no lote
| arquivo | tipo de mudança | etapa | risco | pode reabrir? |
|---|---|---|---|---|

## 7. Arquivos protegidos
- 

## 8. SQL e documentação relacionadas
- patch SQL relacionado:
- documentação espelhada em `docs/patches/`:
- ordem de aplicação:
- rollback conhecido:
- impacto em `docs/index.md`:
- impacto em `docs/changelog.md`:
- impacto em registro/handoff do lote:

## 9. Validações já executadas
- [ ] path afetado validado localmente
- [ ] lint executado
- [ ] typecheck executado
- [ ] build executado
- [ ] migration aplicada/testada
- [ ] fluxo manual validado
- [ ] deploy refeito/testado
- [ ] diff revisado

## 10. Correções permitidas nesta transferência
- arquivos que PODEM ser alterados:
- arquivos que devem ser preservados ao máximo:
- correções obrigatórias já conhecidas:
- melhorias opcionais permitidas:
- itens expressamente proibidos:

## 11. Riscos remanescentes
- 

## 12. Próxima ação esperada da outra conta
Descrever objetivamente:
- o que deve investigar primeiro
- o que deve corrigir
- o que não deve fazer
- o que deve devolver no handoff de retorno
```
