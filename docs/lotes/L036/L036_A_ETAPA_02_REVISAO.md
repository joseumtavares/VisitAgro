# L036A — ETAPA 02 — REVISÃO TÉCNICA

## 1. Resumo executivo

Classificação geral do lote: **aprovado com ressalvas**, com **correções obrigatórias** antes de considerar o lote fechado.

O material anexado demonstra intenção correta de introduzir o papel `representative`, restringir visibilidade no módulo de vendas e registrar uma migration incremental. Porém, a entrega da ETAPA 01 veio **incompleta para revisão integral**: o ZIP não contém os patches prometidos para os arquivos de código nem a documentação referenciada no próprio guia. Além disso, há pelo menos um problema objetivo na documentação SQL: a validação sugerida usa `pg_constraint.consrc`, coluna removida do PostgreSQL desde a versão 12.

No repositório real, já existem indícios de implementação parcial/alinhada para `representative` em `src/types/index.ts` e `src/app/dashboard/sales/page.tsx`, mas o comportamento crítico de segregação de pedidos por representante **não está presente** no `GET /api/orders`, e a sidebar ainda não restringe itens como `Indicadores` e `Com. Indicadores` para esse perfil.

## 2. Pontos aprovados

### 2.1 Aderência parcial aos paths reais
- Os caminhos citados no guia existem no repositório real:
  - `src/types/index.ts`
  - `src/app/api/orders/route.ts`
  - `src/app/dashboard/sales/page.tsx`
  - `src/components/layout/DashboardShell.tsx` citeturn474434view2turn474434view3turn474434view5turn474434view6

### 2.2 Preservação de soft delete no fluxo de pedidos
- O `GET /api/orders` no repositório já respeita `workspace` e `deleted_at`, o que está alinhado com `AGENTES.md` para leituras em tabelas com soft delete. citeturn708404view0turn708404view1turn242383view0

### 2.3 Contrato de tipos já contempla `representative`
- O repositório real já contém `UserRole = 'admin' | 'user' | 'manager' | 'representative'`, o que confirma compatibilidade de contrato TypeScript para esse papel. citeturn281821view0turn708404view7

### 2.4 UI de vendas já possui preparação parcial para representative
- A página de vendas já distingue `isRepresentative` e exibe mensagem informando que o pedido será registrado automaticamente em nome do usuário logado. Isso reduz risco de ruptura de UX caso a API seja fechada corretamente. citeturn939241view3turn914994view4

### 2.5 Migration incremental, sem reescrever schema inteiro
- A abordagem de entregar SQL incremental (`sql/050_representative_role.sql`) está alinhada com as regras do projeto para mudanças de schema em lotes pequenos. citeturn242383view0turn474434view0

## 3. Correções obrigatórias

### 3.1 Entrega ZIP incompleta
**Classificação:** correção obrigatória

O ZIP anexado contém apenas:
- `GUIA_APLICACAO.md`
- `sql/050_representative_role.sql`

Mas o próprio guia afirma haver cinco arquivos modificados/criados e ainda referencia:
- `docs/patches/050_representative_role.md`
- `docs/lotes/L036-A_ETAPA_01_EXECUCAO.md`

Esses artefatos **não vieram no pacote**. Isso viola a regra do `AGENTES.md` para pacote ZIP, que exige patches/instruções dos arquivos alterados, documentação atualizada quando houver impacto e `GUIA_APLICACAO.md`; se item aplicável estiver ausente, a entrega está incompleta. citeturn914994view0

**Ação exigida:** reenviar a ETAPA 01 com os patches reais ou, no mínimo, instruções precisas por arquivo com âncora textual, operação e bloco exato.

### 3.2 Falta de evidência do filtro por representative em `GET /api/orders`
**Classificação:** correção obrigatória

O objetivo central do lote é restringir vendas por perfil. No repositório real, o `GET /api/orders` filtra apenas por `workspace` e `deleted_at`; não há evidência de filtro por `user_id` para `role = 'representative'`. citeturn708404view0turn708404view1

**Impacto:** sem esse filtro, representantes podem continuar vendo pedidos de outros usuários do mesmo workspace.

**Ação exigida:** o patch precisa demonstrar e documentar claramente a regra:
- `admin` e `manager` → visão global do workspace
- `representative` → apenas pedidos com `orders.user_id = userId`

### 3.3 Navegação do shell não atende ao escopo descrito no guia
**Classificação:** correção obrigatória

O guia afirma que o representative não deve ver `Indicadores`, `Com. Indicadores`, `Manutenção` e `Logs`. Porém, no repositório real, a sidebar só restringe itens marcados como `adminOnly`, ou seja, hoje apenas `Manutenção` e `Logs`; `Indicadores` e `Com. Indicadores` continuam visíveis para qualquer usuário autenticado. citeturn795834view3turn914994view3

**Ação exigida:** o patch do `DashboardShell.tsx` precisa existir no pacote e aplicar regra explícita por role, não apenas `adminOnly`.

### 3.4 Tabela de vendas ainda expõe coluna “Ação” no cabeçalho
**Classificação:** correção obrigatória

O guia afirma que a tabela de vendas deve ficar sem coluna “Ação” para representative. No código atual, o cabeçalho `Ação` continua sendo renderizado sem guarda condicional, enquanto apenas a coluna `Representante` depende de `isAdminOrManager`. citeturn914994view5

**Ação exigida:** o patch precisa demonstrar a remoção/ocultação do cabeçalho e das células correspondentes para `representative`, preservando alinhamento das colunas.

### 3.5 Consulta de validação do guia usa `pg_constraint.consrc`
**Classificação:** correção obrigatória

O `GUIA_APLICACAO.md` manda validar a constraint com `SELECT consrc FROM pg_constraint ...`, e o SQL também menciona isso nos comentários. Esse campo foi removido do PostgreSQL 12; a documentação atual de `pg_constraint` não lista `consrc`, e as release notes do PostgreSQL 12 registram sua remoção, recomendando `pg_get_expr(conbin, conrelid)` ou `pg_get_constraintdef()`. citeturn874412view0turn874412view1

**Ação exigida:** substituir as consultas de validação por algo compatível, por exemplo:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_role_check';
```

### 3.6 Documentação obrigatória do lote não foi entregue
**Classificação:** correção obrigatória

O repositório mantém convenção explícita em `docs/lotes/` para `ETAPA_01_EXECUCAO`, `ETAPA_02_REVISAO`, `ETAPA_03_AUDITORIA`, `ETAPA_04_SINTESE` e handoff. A própria pasta informa que nenhum lote deve ser considerado concluído sem atualização documental coerente e referência cruzada ao patch SQL quando houver. citeturn914994view2

**Ação exigida:** incluir no pacote, no mínimo:
- `docs/lotes/L036A_ETAPA_01_EXECUCAO.md` ou nome consistente com a convenção adotada
- `docs/patches/050_representative_role.md`
- atualização coerente de `docs/changelog.md`
- atualização de `docs/index.md` quando houver novo documento permanente

## 4. Melhorias recomendadas

### 4.1 Endurecer PUT/DELETE por propriedade do pedido
**Classificação:** melhoria recomendada

O próprio guia reconhece que `PUT /api/orders/[id]` e `DELETE /api/orders/[id]` ainda não fazem guard de propriedade. Isso é uma dívida real: o `PUT` lê e atualiza por `id + workspace + deleted_at`, e o `DELETE` cancela logicamente também por `id + workspace`, sem evidência de verificação de dono do pedido para representative. citeturn708404view2turn939241view7

**Recomendação:** para `representative`, exigir `prev.user_id === userId` em GET individual, PUT e DELETE.

### 4.2 Tornar a migration mais resiliente a instalações divergentes
**Classificação:** melhoria recomendada

O comentário assume que o nome da constraint é `users_role_check` “padrão gerado pelo PG”. Em ambientes legados isso pode variar. Não é erro fatal no cenário atual, mas seria mais seguro localizar a constraint real antes de recriá-la ou documentar pré-checagem obrigatória.

### 4.3 Documentar explicitamente a matriz de permissão
**Classificação:** melhoria recomendada

Como o lote mexe em API + UI + navegação, vale incluir uma tabela curta com permissões por role (`admin`, `manager`, `representative`) para reduzir regressão futura.

## 5. Riscos de regressão

1. **Exposição indevida de pedidos** se o filtro do `GET /api/orders` não estiver efetivamente implementado para `representative`. citeturn708404view0turn708404view1
2. **Inconsistência de UX** se a sidebar esconder páginas, mas a API continuar retornando dados globais, ou vice-versa. citeturn914994view3turn708404view0
3. **Quebra operacional no checklist SQL** porque a validação baseada em `consrc` falhará em PostgreSQL moderno. citeturn874412view0turn874412view1
4. **Conflito de documentação** se `docs/changelog.md`, `docs/index.md` e `docs/lotes/*` não forem atualizados no mesmo lote, contrariando o playbook operacional. citeturn474434view0turn914994view2
5. **Falsa sensação de fechamento do lote** porque o guia cita arquivos e patches que não estão no pacote entregue.

## 6. Bloco de preservação obrigatória

Preservar obrigatoriamente, sem regressão:

- filtro por `workspace` em todas as rotas de pedidos; citeturn708404view1turn708404view2
- filtro por `deleted_at IS NULL` nas leituras e atualizações de pedidos; citeturn708404view1turn708404view2turn939241view7
- contrato TypeScript que já inclui `representative` em `UserRole`; citeturn708404view7
- comportamento da UI que informa ao representative que o pedido será vinculado automaticamente ao usuário logado; citeturn914994view4
- estratégia de patch incremental em SQL, sem reescrever schema inteiro; citeturn242383view0turn474434view0
- diffs mínimos em arquivos sensíveis/shared, conforme `AGENTES.md`. citeturn242383view0turn914994view0

## 7. Validações adicionais

### 7.1 API
- testar `GET /api/orders` com:
  - admin
  - manager
  - representative com pedidos próprios
  - representative sem pedidos
- testar `GET /api/orders/[id]` de representative sobre pedido de terceiro
- testar `PUT /api/orders/[id]` de representative sobre pedido de terceiro
- testar `DELETE /api/orders/[id]` de representative sobre pedido de terceiro

### 7.2 UI
- validar menu lateral por perfil
- validar ausência da coluna `Ação` para representative
- validar que representative não precisa preencher `user_id` manualmente
- validar que manager/admin continuam podendo escolher representante

### 7.3 Banco
- aplicar migration em ambiente de homologação
- validar constraint com `pg_get_constraintdef(oid)`
- validar criação idempotente dos índices de `rep_regions`
- validar inserção e remoção de usuário `role='representative'`

## 8. Impacto documental

### Obrigatório atualizar
- `docs/changelog.md` — registrar o lote e o impacto em controle de acesso / representative. O playbook operacional manda preferir atualização do changelog no fecho do lote. citeturn474434view0
- `docs/index.md` — incluir referência a novo documento permanente em `docs/patches/` e/ou `docs/lotes/` se a convenção do projeto exigir indexação manual. citeturn281821view9turn914994view2
- `docs/patches/050_representative_role.md` — obrigatório se houve migration e ele é citado pelo próprio guia.
- `docs/lotes/L036A_ETAPA_01_EXECUCAO.md` — obrigatório para rastreabilidade do lote.

### Observação documental
O `GUIA_APLICACAO.md` está útil como suporte operacional, mas **não substitui** os artefatos formais de `docs/lotes/` e `docs/patches/`.

## 9. Handoff para auditoria

### Status sugerido para ETAPA 03
**Enviar para auditoria somente após sanar as correções obrigatórias abaixo:**

1. reenviar o pacote ZIP completo com patches reais dos arquivos alterados;
2. comprovar o filtro de `GET /api/orders` por `user_id` quando `role='representative'`;
3. comprovar filtro de navegação no `DashboardShell.tsx` para ocultar `Indicadores` e `Com. Indicadores` de representative;
4. comprovar remoção da coluna/ações indevidas na tabela de vendas para representative;
5. corrigir as consultas de validação SQL que usam `consrc`;
6. entregar documentação coerente em `docs/patches/`, `docs/lotes/`, `docs/changelog.md` e, se aplicável, `docs/index.md`.

### Perguntas que a auditoria deve responder
- O representative consegue ver apenas seus próprios pedidos?
- O representative consegue acessar, editar ou cancelar pedido de outro usuário por URL direta?
- A migration é reaplicável e segura em banco já existente?
- O lote deixou rastreabilidade documental completa?
- O comportamento de admin/manager foi preservado sem regressão?

## 10. Veredito final

**Aprovado com ressalvas**.

O lote tem direção técnica correta e parte da base real já está compatível com o objetivo. Porém, **não pode ser tratado como concluído** porque faltam evidências centrais da ETAPA 01, há documentação obrigatória ausente no pacote e existe erro objetivo nas instruções SQL de validação.
