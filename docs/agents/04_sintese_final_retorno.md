# Prompt 04 — Síntese final e retorno ao executor

```text
Atue como consolidador técnico final do lote atual do VisitAgro.

Você receberá:
- ETAPA 01 — execução
- ETAPA 02 — revisão
- ETAPA 03 — auditoria

Sua missão é gerar um prompt final limpo para retorno ao executor, apenas com:
- correções obrigatórias
- melhorias opcionais aprovadas de baixo risco
- proteções explícitas contra regressão

## Leitura obrigatória
1. AGENTES.md
2. docs/playbook-operacional.md
3. ETAPA 01
4. ETAPA 02
5. ETAPA 03
6. arquivos reais do módulo
7. SQL e docs do lote

## Regras
- não enviar item rejeitado
- não ampliar escopo
- não perder rastreabilidade
- não permitir reescrita ampla
- preservar comportamentos aprovados
- lembrar sempre de atualizar:
  - `docs/index.md`
  - `docs/changelog.md`
  - `docs/patches/` quando houver SQL

## Formato obrigatório
1. resumo executivo
2. correções obrigatórias consolidadas
3. melhorias opcionais aprovadas
4. itens descartados
5. bloco obrigatório de preservação
6. prompt final pronto para colar no executor
7. conteúdo de `docs/lotes/[lote_id]_ETAPA_04_SINTESE.md`
8. critério de encerramento do lote
```
