# Template — Documento espelhado para patch SQL

```md
# [NNN_slug] Patch SQL — [título]

## 1. Identificação
- arquivo_sql: `sql/[NNN_slug].sql`
- data:
- lote:
- versão/release relacionada:
- autor:

## 2. Objetivo
Descrever o problema que o patch resolve.

## 3. Estruturas afetadas
- tabelas:
- colunas:
- índices:
- functions/RPC:
- triggers:
- constraints:
- policies:

## 4. Compatibilidade
- impacto em código existente:
- necessidade de rollout coordenado:
- ordem de deploy:

## 5. Passo a passo de aplicação
1.
2.
3.

## 6. Validação pós-aplicação
- query 1:
- query 2:
- fluxo funcional:
- build esperado:

## 7. Rollback
Descrever rollback realista.

## 8. Arquivos de código que dependem deste patch
- 

## 9. Atualizações documentais obrigatórias
- docs/index.md
- docs/changelog.md
- registro do lote
```
