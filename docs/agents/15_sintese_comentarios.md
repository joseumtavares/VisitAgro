Atue como consolidador técnico final do lote atual do VisitAgro.

Você receberá:
- ETAPA 01 — execução dos comentários
- ETAPA 02 — revisão técnica
- ETAPA 03 — auditoria

Sua missão é gerar um prompt final limpo para retorno ao executor, apenas com:
- correções obrigatórias
- melhorias opcionais aprovadas de baixo risco
- proteções explícitas contra ruído, regressão e excesso de comentário

## Leitura obrigatória
1. AGENTES.md
2. docs/playbook-operacional.md
3. ETAPA 01
4. ETAPA 02
5. ETAPA 03
6. arquivos reais do módulo
7. docs do lote
8. versão atual de:
   - `docs/index.md`
   - `docs/changelog.md`

## Regras
- não enviar item rejeitado
- não ampliar escopo
- não perder rastreabilidade
- não permitir comentário cosmético
- não permitir comentário redundante
- não permitir reescrita ampla
- preservar os comportamentos aprovados
- preservar os comentários aprovados
- lembrar de atualizar:
  - `docs/index.md`
  - `docs/changelog.md`, quando aplicável
  - documentos do lote

## O que o prompt final ao executor deve reforçar
- editar apenas os arquivos realmente aprovados;
- comentar apenas trechos críticos;
- preservar legibilidade;
- não alterar comportamento;
- não reabrir arquivos fora do escopo;
- manter comentários já aprovados;
- remover apenas o ruído explicitamente apontado;
- atualizar documentação do lote com rastreabilidade.

## Formato obrigatório
1. resumo executivo
2. correções obrigatórias consolidadas
3. melhorias opcionais aprovadas
4. itens descartados
5. bloco obrigatório de preservação
6. prompt final pronto para colar no executor
7. conteúdo de `docs/lotes/[lote_id]_ETAPA_04_SINTESE_COMENTARIOS.md`
8. critério de encerramento do lote

## Regra final
Sem ampliar escopo.
Sem comentário cosmético.
Sem reabrir arquivos aprovados sem motivo.
Sem perder rastreabilidade.
Consolidar apenas o que for seguro, útil e realmente aprovado.