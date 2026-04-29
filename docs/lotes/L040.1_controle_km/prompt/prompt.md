# Prompt — L040.1_controle_km

Atue como **Agente 02 — Mapa de Impacto Técnico** do repositório VisitAgro.

## Objetivo

Mapear o impacto técnico do lote `L040.1_controle_km` antes de qualquer implementação.

**Nenhuma implementação deve ser feita nesta etapa.**

## Lote

- `lote_id`: `L040.1`
- `slug`: `controle_km`
- título: `Controle diário de KM dos representantes`
- estado: `aberto`
- origem: `solicitação humana`

## Leitura obrigatória, nesta ordem

1. `AGENTES.md`
2. `docs/playbook-operacional.md`
3. `docs/index.md`
4. `docs/changelog.md`
5. `docs/ui/responsividade.md`
6. `docs/padrao_de_comentarios.md`
7. `docs/patches/`
8. `sql/`
9. `docs/lotes/`
10. Arquivos reais afetados em `src/app/api`, `src/app/dashboard`, `src/components/layout` e `src/types`

## Missão do Agente 02

Produzir um mapa de impacto com evidências reais de:

1. existência atual da tabela `km_logs`;
2. presença ou ausência de `workspace` em `km_logs`;
3. índices/constraints necessários para controle diário;
4. rotas API existentes similares a reaproveitar;
5. páginas CRUD existentes similares a reaproveitar;
6. arquivos sensíveis;
7. contrato API mínimo recomendado;
8. riscos de acesso por perfil;
9. riscos de responsividade;
10. recomendação objetiva: implementar em um lote único ou quebrar em sublotes.

## Escopo do lote futuro

Implementar controle diário de KM de representantes com:

- schema/migration incremental, se necessário;
- API CRUD protegida;
- UI mobile-first;
- soft delete;
- auditoria;
- atualização documental.

## Fora de escopo

- GPS em tempo real;
- cálculo automático de rota;
- integração automática com visitas;
- reembolso financeiro;
- PDF, WhatsApp, Excel/CSV;
- relatórios avançados;
- refatoração de auth, middleware, apiFetch, Zustand ou Supabase admin;
- mudanças em pedidos, comissões, clientes, produtos, indicadores ou pré-cadastros.

## Regras críticas

- Não assumir paths sem ler os arquivos reais.
- Não propor alteração ampla em arquivos sensíveis.
- Não usar `getAdmin()` sem estratégia explícita de `workspace`/autorização.
- Não criar UI antes de confirmar contrato da API.
- Não ignorar `deleted_at`.
- Não quebrar desktop ao aplicar mobile-first.
- Seguir `docs/padrao_de_comentarios.md` real do repositório.

## Saída esperada

Responder com:

1. Resumo do mapa de impacto.
2. Evidências por arquivo, com caminhos reais.
3. Tabela de riscos.
4. Decisão sobre migration SQL.
5. Contrato API proposto.
6. Mapa UI proposto.
7. Lista de arquivos a criar/alterar.
8. Arquivos de alta sensibilidade.
9. Recomendação de execução: prosseguir, quebrar sublotes ou bloquear.
10. Checklist de validação específico para o executor.
