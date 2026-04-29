# L031_ETAPA_04_SINTESE

## 1. Resumo executivo

O lote **L031** permanece com **correções obrigatórias pendentes**. A leitura consolidada das etapas anexadas e do repositório real converge no mesmo ponto: a correção descrita na ETAPA 01 não foi materializada integralmente no pacote nem no estado atual do repo. O helper `src/lib/repCommissionHelper.ts` é o único ponto com evidência clara de alteração proposta, mas o `POST /api/orders` e a tela `/dashboard/sales` continuam no estado antigo no repositório público.

Portanto, o retorno ao executor deve ser **cirúrgico e fechado**, limitado a:
- concluir o patch faltante em `src/app/api/orders/route.ts`;
- concluir o patch faltante em `src/app/dashboard/sales/page.tsx`;
- preservar o fluxo já aprovado do `PUT /api/orders/[id]` e a separação entre comissões de indicador e de representante;
- corrigir a rastreabilidade documental do lote sem ampliar escopo.

Sem esses pontos, o lote não pode ser encerrado.

---

## 2. Correções obrigatórias consolidadas

1. **Completar o patch funcional do lote em `src/app/api/orders/route.ts`.**
   - No `POST`, persistir `user_id` explicitamente no insert de `orders` usando o `x-user-id` já lido da request.
   - No `POST`, importar e chamar `generateRepCommissions` quando o pedido nascer com `status === 'pago'` e houver itens elegíveis.
   - O fluxo de comissão de indicador com `generateCommission` deve permanecer intacto.

2. **Completar o patch funcional do lote em `src/app/dashboard/sales/page.tsx`.**
   - Remover `commission_value: calcCommission()` do payload enviado ao `POST /api/orders`.
   - Remover da tabela de vendas a coluna de comissão de indicador ligada a `o.commission_value`.
   - Remover do modal o resumo “Comissão indicador”.
   - Manter a comissão de indicador exclusiva da tela `/dashboard/commissions`.

3. **Corrigir o falso positivo no helper `src/lib/repCommissionHelper.ts`.**
   - O insert em `rep_commissions` deve validar `insertError` antes de incrementar `created`.
   - Em caso de erro de insert, registrar log, incrementar `skipped` e seguir o loop sem mascarar falha.

4. **Corrigir a documentação incorreta da ETAPA 01.**
   - Ajustar a afirmação de schema: `rep_id` e `rep_name` existem em `rep_commissions`, não em `orders`.
   - Em `orders`, o campo relevante para este lote é `user_id`.

5. **Fechar a rastreabilidade documental do lote.**
   - Registrar `docs/lotes/L031_ETAPA_02_REVISAO.md`.
   - Registrar `docs/lotes/L031_ETAPA_03_AUDITORIA.md`.
   - Registrar `docs/lotes/L031_ETAPA_04_SINTESE.md`.
   - Atualizar `docs/index.md` com referência coerente ao histórico do lote.
   - Atualizar `docs/changelog.md` apenas com o que tiver sido efetivamente aplicado e validado.
   - **Não** criar patch SQL novo nem entrada em `docs/patches/` para este lote, salvo surgimento de evidência nova real.

---

## 3. Melhorias opcionais aprovadas

1. **Hardening leve no helper com baixo risco.**
   - Nas leituras auxiliares de `users` e `clients`, adicionar filtro explícito de `workspace`.
   - Para `clients`, aplicar também `deleted_at IS NULL` se o padrão do módulo já exigir soft delete nessas leituras.
   - Essa melhoria é opcional e só entra se for implementada como diff localizado, sem refatoração lateral.

2. **Anexar evidência mínima de validação na documentação do lote.**
   - Registrar no conteúdo final do lote que `npm run lint` e `npm run build` foram executados.
   - Registrar o resultado do fluxo manual mínimo exigido.

---

## 4. Itens descartados

1. Reabrir `src/app/api/orders/[id]/route.ts`.
2. Reescrever `src/app/api/rep-commissions/route.ts`.
3. Alterar `src/app/dashboard/commissions/page.tsx`.
4. Alterar `src/app/dashboard/rep-commissions/page.tsx`.
5. Criar migration nova ou mexer em `sql/030_rep_commissions_rep_id.sql`.
6. Fazer refatoração ampla de tipagem, layout, nomenclatura ou estrutura fora do patch mínimo.
7. Incluir backfill, reprocessamento massivo ou correção retroativa de pedidos antigos sem `user_id`.

---

## 5. Bloco obrigatório de preservação

- Preservar exatamente o fluxo já existente em `src/app/api/orders/[id]/route.ts` para geração de `rep_commissions` na transição para `pago`.
- Preservar a restrição de acesso da rota `/api/rep-commissions`, onde usuário não-admin enxerga apenas as próprias comissões.
- Preservar a separação de domínio:
  - indicador → `/dashboard/commissions`
  - representante → `/dashboard/rep-commissions`
- Não reescrever arquivos sensíveis por inteiro; aplicar patch localizado.
- Não introduzir migration nova sem evidência concreta de necessidade.
- Não alterar contrato de payload além do necessário para retirar `commission_value` da tela de vendas.
- Não remover comportamentos aprovados já existentes no `PUT` de pedidos.
- Não atualizar changelog como se o lote estivesse concluído sem validação mínima real.

---

## 6. Prompt final pronto para colar no executor

```md
Atue no lote **L031** com patch **mínimo, rastreável e sem ampliar escopo**.

## Objetivo
Concluir o pós-fix de comissões de representantes que ficou incompleto no pacote anterior.

## Leia antes de alterar
1. `docs/AGENTES.md`
2. `docs/playbook-operacional.md`
3. `docs/lotes/L031_ETAPA_02_REVISAO.md`
4. `docs/lotes/L031_ETAPA_03_AUDITORIA.md`
5. arquivos reais do módulo no repositório
6. `sql/030_rep_commissions_rep_id.sql`

## Correções obrigatórias

### 1) `src/lib/repCommissionHelper.ts`
Aplicar correção localizada no insert de `rep_commissions`:
- capturar `insertError` do `.insert(...)`
- **não** incrementar `created` se houver erro
- em caso de erro:
  - fazer `console.error(...)` com contexto mínimo
  - incrementar `skipped`
  - seguir o loop com `continue`

### 2) `src/app/api/orders/route.ts`
Concluir o patch do `POST`:
- importar `generateRepCommissions` de `@/lib/repCommissionHelper`
- no insert de `orders`, persistir explicitamente:
  - `user_id: userId ?? null`
- manter o fluxo atual de `generateCommission` para indicador
- após inserir `order_items`, quando:
  - `body.status === 'pago'`
  - existir `userId`
  - existir item elegível
  chamar `generateRepCommissions(admin, order, itemsPayload)`
- se `created > 0`, registrar `auditLog` localizado
- não alterar o comportamento já existente do `GET`
- não refatorar o arquivo inteiro

### 3) `src/app/dashboard/sales/page.tsx`
Aplicar patch mínimo na tela de vendas:
- remover `commission_value: calcCommission()` do payload do save
- remover a coluna de comissão da tabela de vendas ligada a `o.commission_value`
- remover o resumo “Comissão indicador” do modal
- manter total e demais campos atuais
- não migrar lógica de indicador para outro lugar nesta tarefa

### 4) Documentação e rastreabilidade
Atualizar obrigatoriamente:
- `docs/index.md`
- `docs/changelog.md`
- `docs/lotes/L031_ETAPA_02_REVISAO.md`
- `docs/lotes/L031_ETAPA_03_AUDITORIA.md`
- `docs/lotes/L031_ETAPA_04_SINTESE.md`

Regras documentais:
- corrigir a afirmação errada de que `rep_id` e `rep_name` estão em `orders`
- registrar que esses campos estão em `rep_commissions`
- registrar no changelog **apenas** o que foi realmente aplicado
- **não** criar arquivo novo em `docs/patches/` e **não** criar SQL novo neste lote

## Melhoria opcional aprovada de baixo risco
Somente se couber em diff mínimo:
- no helper, adicionar filtros explícitos de `workspace` nas leituras auxiliares de `users` e `clients`
- para `clients`, aplicar `deleted_at IS NULL` se isso já estiver alinhado ao padrão local

## Proibições
- não ampliar escopo
- não tocar em módulos adjacentes
- não reabrir `src/app/api/orders/[id]/route.ts`
- não reescrever `src/app/api/rep-commissions/route.ts`
- não alterar `src/app/dashboard/commissions/page.tsx`
- não alterar `src/app/dashboard/rep-commissions/page.tsx`
- não criar migration
- não fazer refatoração cosmética
- não reordenar imports em massa
- não reescrever arquivos inteiros

## Proteções explícitas contra regressão
- preservar o fluxo já existente do `PUT /api/orders/[id]` para geração de `rep_commissions`
- preservar a restrição de acesso de `/api/rep-commissions`
- preservar a separação:
  - indicador → `/dashboard/commissions`
  - representante → `/dashboard/rep-commissions`
- preservar `generateCommission` no `POST` para comissão de indicador
- não quebrar o payload atual da venda além da retirada de `commission_value`

## Validação mínima obrigatória
1. `npm run lint`
2. `npm run build`
3. Fluxo manual A:
   - criar pedido com `status = pago`
   - usar item com `rep_commission_pct > 0`
   - confirmar linha em `rep_commissions`
4. Fluxo manual B:
   - criar pedido pendente
   - mudar para pago
   - confirmar que o `PUT` continua gerando `rep_commissions`
5. Fluxo manual C:
   - confirmar que `/dashboard/sales` não mostra mais comissão de indicador
6. Fluxo manual D:
   - confirmar que `/dashboard/commissions` continua sendo a tela de indicador
7. Fluxo manual E:
   - confirmar que `/dashboard/rep-commissions` continua correta para admin e não-admin
8. Verificação SQL manual:
   - `orders.user_id` preenchido no pedido criado via POST
   - `rep_commissions.rep_id` preenchido

## Entrega esperada
Responder com:
1. resumo executivo
2. causa raiz
3. arquivos alterados
4. diff por arquivo
5. validação executada
6. impacto documental
7. observações de regressão preservada
```

---

## 7. Conteúdo para download de `docs/lotes/L031_ETAPA_04_SINTESE.md`

Este próprio documento já está no formato pronto para uso como `docs/lotes/L031_ETAPA_04_SINTESE.md`.

---

## 8. Critério de encerramento do lote

O lote **só pode ser encerrado** quando todos os itens abaixo estiverem verdadeiros ao mesmo tempo:

- `src/lib/repCommissionHelper.ts` estiver com tratamento explícito de erro no insert.
- `src/app/api/orders/route.ts` persistir `user_id` no `POST` e chamar `generateRepCommissions` para pedido criado já como `pago`.
- `src/app/dashboard/sales/page.tsx` não enviar `commission_value`, não exibir coluna de comissão e não exibir “Comissão indicador”.
- `PUT /api/orders/[id]` permanecer intacto e funcional.
- `/dashboard/commissions` continuar sendo a tela de indicador.
- `/dashboard/rep-commissions` continuar sendo a tela de representante.
- `npm run lint` passar.
- `npm run build` passar.
- validação manual mínima e verificação SQL terem sido registradas.
- `docs/index.md`, `docs/changelog.md` e `docs/lotes/` terem sido atualizados de forma coerente.
- não existir migration nova nem alteração indevida de escopo.
