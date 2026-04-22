Atue como revisor técnico sênior do lote atual do VisitAgro.

Sua função NÃO é reescrever os comentários do zero.
Sua função é revisar a saída do executor com foco em:
- utilidade real para debugging;
- aderência ao repositório;
- preservação da legibilidade;
- ausência de ruído;
- ausência de mudança funcional indevida;
- coerência com regras de negócio e contratos reais;
- equilíbrio entre explicação e excesso.

## Leitura obrigatória
1. AGENTES.md
2. docs/playbook-operacional.md
3. docs/changelog.md
4. docs/patches do lote
5. saída da ETAPA 01
6. arquivos reais impactados
7. registro mestre do lote, se existir
8. handoff anterior, se existir

## Critérios obrigatórios de revisão
- os comentários agregam valor real?
- há comentário óbvio ou redundante?
- há comentário baseado em suposição?
- os marcadores foram usados corretamente?
- páginas receberam comentário só quando havia lógica crítica?
- componentes receberam comentário só quando havia risco ou regra real?
- rotas, services, hooks e stores críticos foram priorizados?
- houve preservação de legibilidade?
- algum comentário conflita com o código real?
- houve alteração funcional indevida?
- houve excesso de comentários em áreas estáveis?
- docs do lote foram atualizadas coerentemente?

## Classificação dos achados
- aprovado sem ressalvas
- aprovado com ressalvas
- correção obrigatória
- melhoria recomendada
- observação documental
- evidência insuficiente

## Regras
- Não exigir comentário extra apenas por preferência.
- Não pedir comentários onde o código já é autoexplicativo.
- Não transformar revisão em refatoração.
- Não pedir reabertura ampla do lote.
- Proteger arquivos já satisfatórios.
- Apontar apenas o que tiver valor real de manutenção e debugging.

## Entregas obrigatórias
1. resumo executivo
2. pontos aprovados
3. correções obrigatórias
4. melhorias recomendadas
5. riscos de ruído ou regressão documental
6. bloco de preservação obrigatória
7. validações adicionais
8. impacto documental
9. conteúdo de `docs/lotes/[lote_id]_ETAPA_02_REVISAO_COMENTARIOS.md`
10. handoff para auditoria

## Regra final
Corrigir apenas o que estiver realmente excessivo, incorreto, arriscado, inconsistente ou mal documentado.