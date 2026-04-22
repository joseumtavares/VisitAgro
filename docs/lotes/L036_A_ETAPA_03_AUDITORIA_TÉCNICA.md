# L036-A — ETAPA 03 — AUDITORIA TÉCNICA

**Lote:** L036-A
**Título:** Controle de acesso por perfil — representative em Vendas e Comissões
**Data da auditoria:** 2026-04-22
**Auditor:** Agente Auditor (segunda camada)
**Status:** ⚠️ Aprovado com correções obrigatórias pendentes

---

## 1. Resumo Executivo

O lote L036-A tem **direção técnica correta** e o pacote entregue (`patches/analise_agents/L036A/`) contém implementação adequada para todas as lacunas identificadas. Porém, ao confrontar o material com o estado real do repositório, constatou-se que **apenas 1 de 4 alterações críticas foi aplicada**:

| Alteração | Status no repo | Pacote L036A |
|-----------|----------------|--------------|
| `UserRole` com `'representative'` | ✅ Já aplicado | ✅ Contém |
| Filtro `GET /api/orders` por role | ❌ Ausente | ✅ Contém |
| `DashboardShell` com `hideForRepresentative` | ❌ Ausente | ✅ Contém |
| `sales/page.tsx` sem coluna Ação para rep | ❌ Parcial | ✅ Contém |

**Veredito preliminar:** O pacote deve ser aplicado integralmente. A ETAPA 01 foi incompleta na execução real. A ETAPA 02 identificou corretamente as lacunas. Esta ETAPA 03 arbitra conflitos e separa o que é obrigatório do que é opcional.

---

## 2. O que da revisão (ETAPA 02) procede integralmente

### 2.1 Entrega ZIP incompleta (§3.1 da ETAPA 02)
**Procede.** O pacote original não continha os patches dos arquivos de código, apenas `GUIA_APLICACAO.md` e `sql/050_representative_role.sql`. Os arquivos de código agora estão presentes em `patches/analise_agents/L036A/src/`, mas a documentação referenciada (`docs/patches/050_representative_role.md`, `docs/lotes/L036-A_ETAPA_01_EXECUCAO.md`) continua ausente.

### 2.2 Falta de evidência do filtro em `GET /api/orders` (§3.2)
**Procede integralmente.** O repositório real em `src/app/api/orders/route.ts` não possui filtro por `role`:

```typescript
// Estado atual do repo (linhas 6-38):
export async function GET(req: NextRequest) {
  const { workspace } = getRequestContext(req); // ← role e userId NÃO são lidos

  const { data, error } = await getAdmin()
    .from('orders')
    .select(...)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  // ← SEM FILTRO POR user_id MESMO PARA representative
```

O pacote L036A corrige isso corretamente lendo `{ workspace, role, userId }` e aplicando `.eq('user_id', userId)` quando `role === 'representative'`.

### 2.3 Navegação do shell não atende ao escopo (§3.3)
**Procede integralmente.** O `DashboardShell.tsx` atual só tem `adminOnly`; não existe `hideForRepresentative`. Itens como `Indicadores` e `Com. Indicadores` permanecem visíveis para todos os perfis.

### 2.4 Tabela de vendas expõe coluna "Ação" (§3.4)
**Procede parcialmente.** O repositório tem `isRepresentative` definido (linha 157), mas ele é usado apenas para exibir mensagem informativa no modal de nova venda (linha 657). A coluna "Ação" com seletor de status **não está protegida** por `canChangeStatus`.

### 2.5 Consulta SQL usa `pg_constraint.consrc` (§3.5)
**Procede integralmente.** Tanto `GUIA_APLICACAO.md` quanto `sql/050_representative_role.sql` usam `SELECT consrc FROM pg_constraint`, campo removido no PostgreSQL 12+. A validação correta deve usar `pg_get_constraintdef(oid)`.

### 2.6 Documentação obrigatória ausente (§3.6)
**Procede integralmente.** Não existem em `docs/`:
- `docs/patches/050_representative_role.md`
- `docs/lotes/L036-A_ETAPA_01_EXECUCAO.md`
- Atualização em `docs/changelog.md` referente a este lote

---

## 3. O que procede parcialmente

### 3.1 "UI de vendas já possui preparação parcial" (§2.4 da ETAPA 02)
**Procede parcialmente.** A afirmação de que "a página de vendas já distingue `isRepresentative`" é tecnicamente verdadeira, mas enganosa. O código atual:

```typescript
const isRepresentative = userRole === 'representative'; // linha 157
// ...
{isRepresentative && (  // linha 657
  <div className="bg-blue-500/10 ...">
    Seu pedido será registrado automaticamente em seu nome.
  </div>
)}
```

Isso é apenas uma **mensagem informativa**, não controle de acesso. A proteção real (ocultar coluna "Ação") não está implementada.

---

## 4. O que não procede

### 4.1 Nenhuma afirmação da ETAPA 02 foi considerada improcedente.
Todas as correções obrigatórias listadas na revisão técnica são válidas e comprovadas no código real.

---

## 5. Correções Obrigatórias (antes de fechar o lote)

### CO-01: Aplicar filtro de role em `GET /api/orders`
**Arquivo:** `src/app/api/orders/route.ts`
**Ação:** Substituir o GET inteiro pelo patch do pacote L036A
**Justificativa:** Lacuna de segurança — representative vê pedidos de terceiros
**Evidência:** Linhas 18-63 do patch `patches/analise_agents/L036A/src/app/api/orders/route.ts`

### CO-02: Adicionar `hideForRepresentative` no `DashboardShell`
**Arquivo:** `src/components/layout/DashboardShell.tsx`
**Ação:**
1. Adicionar propriedade `hideForRepresentative?: boolean` à interface `NavItem`
2. Marcar `Indicadores` e `Com. Indicadores` com `hideForRepresentative: true`
3. Adicionar lógica `isRepresentative` e filtro `visibleNav`
**Justificativa:** Representative não deve acessar módulos de indicadores
**Evidência:** Patch completo em `patches/analise_agents/L036A/src/components/layout/DashboardShell.tsx`

### CO-03: Ocultar coluna "Ação" para representative em `sales/page.tsx`
**Arquivo:** `src/app/dashboard/sales/page.tsx`
**Ação:**
1. Adicionar `const canChangeStatus = !isRepresentative`
2. Condicionar renderização do cabeçalho `<th>Ação</th>` e célula `<td><select></td>` a `canChangeStatus`
**Justificativa:** UX e segurança — representative não pode alterar status de pedidos
**Evidência:** Linhas 58-61 e 243-278 do patch `patches/analise_agents/L036A/src/app/dashboard/sales/page.tsx`

### CO-04: Corrigir validação SQL da constraint
**Arquivo:** `sql/050_representative_role.sql` e `GUIA_APLICACAO.md`
**Ação:** Substituir:
```sql
-- ERRADO (consrc não existe no PG 12+):
SELECT consrc FROM pg_constraint WHERE conrelid = 'public.users'::regclass AND conname = 'users_role_check';

-- CORRETO:
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.users'::regclass AND conname = 'users_role_check';
```
**Justificativa:** Validação falhará em PostgreSQL moderno
**Evidência:** Documentação oficial do PostgreSQL 12+

### CO-05: Entregar documentação obrigatória
**Arquivos a criar:**
- `docs/patches/050_representative_role.md`
- `docs/lotes/L036-A_ETAPA_01_EXECUCAO.md` (atualizar com execução real)
- `docs/lotes/L036-A_ETAPA_03_AUDITORIA.md` (este documento)
- `docs/changelog.md` — adicionar entrada do lote

**Justificativa:** Rastreabilidade e convenção do projeto
**Evidência:** Playbook operacional e AGENTES.md

---

## 6. Melhorias Opcionais Aprovadas (não bloqueiam fechamento)

### MO-01: Guard em `PUT /api/orders/[id]` para representative
**Classificação:** dívida técnica L036-B
**Justificativa:** O filtro de GET já protege contra acesso acidental; ataque deliberado por UUID requer guard adicional, mas pode ser tratado em lote separado.

### MO-02: Tornar migration mais resiliente a nomes de constraint
**Classificação:** hardening opcional
**Justificativa:** O nome `users_role_check` é padrão do PG; documentar pré-checagem já mitiga risco.

### MO-03: Matriz de permissão documental
**Classificação:** melhoria de documentação
**Sugestão:** Incluir tabela em `docs/patches/050_representative_role.md`:

| Role | Vendas (listar) | Vendas (editar status) | Indicadores | Com. Indicadores | Com. Representantes | Manutenção |
|------|-----------------|------------------------|-------------|------------------|---------------------|------------|
| admin | todos | sim | sim | sim | sim | sim |
| manager | todos | sim | sim | sim | sim | não |
| user | todos | sim | sim | sim | sim | não |
| representative | próprios | não | não | não | sim | não |

---

## 7. Itens Rejeitados

### IR-01: "Reabrir módulo de PUT/DELETE de pedidos neste lote"
**Decisão:** Rejeitado.
**Motivo:** Viola regra "não reabrir lote inteiro". O filtro de GET já mitiga risco principal. Guard de propriedade em PUT/DELETE é L036-B.

### IR-02: "Refatorar authStore para tipar `user.role` como `UserRole`"
**Decisão:** Rejeitado.
**Motivo:** Comparação `user.role === 'representative'` funciona mesmo com `role: string`. Refatoração não traz benefício funcional imediato.

### IR-03: "Atualizar `schema_atual_supabase.sql` do repo"
**Decisão:** Rejeitado como obrigatório.
**Motivo:** É cosmético; a migration 050 é auto-suficiente. Pode ser feito em lote de manutenção.

---

## 8. Proteções que Devem Seguir Intactas

### P-01: Filtro por `workspace` em todas as rotas de pedidos
**Não remover** `.eq('workspace', workspace)` do GET ou POST.

### P-02: Filtro por `deleted_at IS NULL`
**Não remover** `.is('deleted_at', null)` das leituras.

### P-03: Contrato `UserRole` já existente
**Não alterar** a definição de `UserRole` além de confirmar `'representative'` (já presente).

### P-04: Estratégia de migration incremental
**Não reescrever** `sql/schema_atual_supabase.sql` inteiro; manter abordagem de scripts incrementais.

### P-05: Diff mínimo em arquivos sensíveis
**Não refatorar** cosmeticamente `DashboardShell.tsx`, `api/orders/route.ts` ou outros arquivos compartilhados.

---

## 9. Veredito Consolidado

### Classificação: ⚠️ APROVADO COM RESSALVAS CRÍTICAS

| Critério | Status |
|----------|--------|
| Direção técnica | ✅ Correta |
| Pacote de patches | ✅ Completo em `patches/analise_agents/L036A/` |
| Execução real no repo | ❌ Incompleta (25% aplicado) |
| Documentação | ❌ Ausente |
| Validação SQL | ❌ Obsoleta (consrc) |
| Segurança (vazamento de dados) | ⚠️ Mitigável com CO-01 |
| Risco de regressão | Baixo (patches cirúrgicos) |

### Condições para fechamento do lote:

1. [ ] Aplicar CO-01 (filtro GET /api/orders)
2. [ ] Aplicar CO-02 (hideForRepresentative no DashboardShell)
3. [ ] Aplicar CO-03 (ocultar coluna Ação no sales/page.tsx)
4. [ ] Aplicar CO-04 (corrigir validação SQL)
5. [ ] Criar CO-05 (documentação obrigatória)
6. [ ] Validar fluxo manual com usuário representative
7. [ ] Atualizar `docs/changelog.md`

### Próximo passo após correções:
**ETAPA 04 — Síntese Final** com handoff para executor aplicar apenas as correções obrigatórias listadas acima.

---

## 10. Conteúdo de `docs/lotes/L036-A_ETAPA_03_AUDITORIA.md`

Este arquivo deve ser criado com o conteúdo integral deste documento, garantindo:

- Rastreabilidade da decisão de auditoria
- Separação clara entre obrigatório e opcional
- Proteção de módulos que não devem ser reabertos
- Evidências de código para cada correção exigida

---

## 11. Handoff para Síntese Final (ETAPA 04)

### Para o sintetizador:

1. **Não reabrir** discussões sobre PUT/DELETE guards — já arbitrado como L036-B
2. **Não pedir** refatoração de `authStore` ou tipagem adicional
3. **Focar** exclusivamente nas 5 correções obrigatórias (CO-01 a CO-05)
4. **Preservar** os 5 pontos listados na seção 8 (proteções)
5. **Gerar** instrução de aplicação cirúrgica, um arquivo por vez, com âncoras textuais

### Estrutura recomendada para ETAPA 04:

```markdown
# L036-A — ETAPA 04 — SÍNTESE FINAL E RETORNO AO EXECUTOR

1. Resumo do que foi auditado
2. Lista numerada das 5 correções obrigatórias
3. Instrução de aplicação por arquivo (caminho + âncora + diff exato)
4. Validação mínima pós-aplicação
5. Mensagem de commit sugerida
6. Entrada para docs/changelog.md
```

---

**Fim da ETAPA 03 — Auditoria Técnica**