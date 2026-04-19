# GUIA DE APLICAÇÃO — Lote L031-FIX2

## Por que este patch substitui os anteriores

Os dois patches anteriores (L031 e L031-fix) foram aplicados mas não funcionaram.
Este patch corrige as causas reais identificadas:

1. **rep_commissions não geradas** — adicionado logging completo em `audit_log`
   para diagnóstico; lógica do PUT reforçada com fallback de `user_id`
2. **Geocodificação parou de funcionar** — Nominatim passou a rejeitar chamadas
   diretas do browser por CORS/User-Agent; criado proxy server-side `/api/geocode`

---

## Arquivos do pacote

```
patches/
├── src/lib/repCommissionHelper.ts           ← substitui completamente
├── src/app/api/orders/route.ts              ← substitui completamente
├── src/app/api/orders/[id]/route.ts         ← substitui completamente (PUT reforçado)
├── src/app/api/geocode/route.ts             ← NOVO ARQUIVO
└── src/app/dashboard/clients/page.tsx      ← substitui completamente
```

---

## Ordem de aplicação

> **Não há migration SQL.** Banco já está correto (patch 030 aplicado anteriormente).

### Passo 1 — Criar arquivo novo
Criar o arquivo:
```
src/app/api/geocode/route.ts
```
com o conteúdo de `patches/src/app/api/geocode/route.ts`.

### Passo 2 — Substituir arquivos existentes
Substituir COMPLETAMENTE (não editar parcialmente):

| Destino no repositório | Origem no pacote |
|------------------------|-----------------|
| `src/lib/repCommissionHelper.ts` | `patches/src/lib/repCommissionHelper.ts` |
| `src/app/api/orders/route.ts` | `patches/src/app/api/orders/route.ts` |
| `src/app/api/orders/[id]/route.ts` | `patches/src/app/api/orders/[id]/route.ts` |
| `src/app/dashboard/clients/page.tsx` | `patches/src/app/dashboard/clients/page.tsx` |

### Passo 3 — Deploy
Fazer deploy normal (push ou vercel deploy).

---

## Verificação após deploy

### A. Verificar que o geocode proxy funciona
Abrir no browser:
```
https://seu-dominio.vercel.app/api/geocode?q=Ararangua+SC&limit=1
```
Deve retornar um array JSON com resultados do Nominatim.

### B. Verificar comissões de representante — fluxo POST
1. Abrir `/dashboard/sales` → Nova Venda
2. Selecionar cliente
3. Adicionar produto com **rep_commission_pct > 0** (checar em Produtos se o produto tem esse campo preenchido)
4. Selecionar status **Pago**
5. Salvar

Verificar no Supabase:
```sql
-- 1. Pegar o ID do pedido criado
SELECT id, user_id, status FROM orders ORDER BY created_at DESC LIMIT 3;

-- 2. Checar rep_commissions
SELECT * FROM rep_commissions WHERE order_id = '<id-do-pedido>';

-- 3. Checar audit_log para diagnóstico
SELECT action, meta, created_at FROM audit_log
WHERE action LIKE '%REP_COMM%' OR action LIKE '%rep_comm%'
ORDER BY created_at DESC LIMIT 10;
```

**Se `user_id` em orders está nulo** após o passo 5:
→ O arquivo `orders/route.ts` não foi substituído corretamente. Verificar o deploy.

**Se `user_id` está preenchido mas `rep_commissions` vazia:**
→ Checar o `audit_log` — haverá uma entrada `[REP_COMM]` explicando o motivo.

**Se o produto não tem `rep_commission_pct > 0`:**
→ Editar o produto em `/dashboard/products` e colocar um valor como `5`.

### C. Verificar comissões — fluxo PUT (pedido pendente → pago)
1. Criar pedido com status **Pendente** (salvar)
2. No dropdown da lista, mudar para **Pago**

Verificar no Supabase:
```sql
SELECT * FROM rep_commissions ORDER BY created_at DESC LIMIT 5;
```

**Nota:** Para pedidos criados ANTES deste patch (com `user_id = null`),
o PUT agora tenta usar o usuário autenticado que fez a mudança como fallback.
Isso garante que mesmo pedidos antigos gerem comissão ao serem marcados como pagos.

### D. Verificar geocodificação de clientes
1. Abrir `/dashboard/clients` → Novo Cliente
2. No campo "Buscar Endereço no Mapa", digitar "Araranguá SC"
3. Clicar em "📍 Buscar"
4. Deve preencher as coordenadas automaticamente

---

## O que mudou tecnicamente em cada arquivo

### `repCommissionHelper.ts`
- Logging completo em `audit_log` a cada etapa
- Erro do insert agora capturado e logado (sem falso positivo)
- Retorno inclui array `errors` para diagnóstico
- Remoção do filtro `workspace` na query de users (não necessário com service_role)

### `orders/route.ts` (POST)
- `userId` lido diretamente do header `x-user-id` (sem fallback para body)
- `user_id` explícito no insert do pedido
- `generateRepCommissions` chamado quando `status === 'pago'`
- Logs detalhados em `audit_log` — mesmo quando rep_commissions não é gerado, registra o motivo
- `referral_id` normalizado para null quando vazio (evita FK violation)

### `orders/[id]/route.ts` (PUT)
- **Novo:** se `order.user_id` é null e o usuário autenticado está disponível, grava o `user_id` no update e usa para gerar rep_commissions
- Resolve o caso de pedidos criados antes do fix do POST
- Logs detalhados em audit_log

### `geocode/route.ts` (NOVO)
- Proxy server-side para Nominatim
- Define `User-Agent` correto (obrigatório pela política do Nominatim)
- Elimina problema de CORS do browser
- Cache de 1 hora para não sobrecarregar o Nominatim

### `clients/page.tsx`
- `geoSearch` usa `/api/geocode?q=...` em vez de chamar Nominatim diretamente
- Tratamento de erro mais claro para o usuário
- Mantém exatamente o mesmo comportamento visual

---

## Arquivos NÃO alterados (preservados)
- `src/app/dashboard/sales/page.tsx` — já corrigido no patch anterior ✓
- `src/app/dashboard/commissions/page.tsx` — sem alteração necessária ✓
- `src/app/dashboard/rep-commissions/page.tsx` — sem alteração necessária ✓
- `src/app/api/rep-commissions/route.ts` — sem alteração necessária ✓
- `src/app/api/rep-commissions/[id]/route.ts` — sem alteração necessária ✓
- Todos os demais arquivos do projeto
