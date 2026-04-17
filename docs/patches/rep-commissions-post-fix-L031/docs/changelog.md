# 📝 Changelog

> Histórico organizado de mudanças relevantes do VisitAgro.

---

## [0.9.5] — Lote L031 — rep_commissions POST fix

### 🐛 Correções
- **`src/lib/repCommissionHelper.ts`** — insert em `rep_commissions` agora verifica o erro retornado antes de incrementar `created`; falhas de banco são logadas e o item é contado como `skipped` em vez de falsamente como criado
- **`src/app/api/orders/route.ts` (POST)** — `user_id` agora é gravado explicitamente a partir do header JWT autenticado (`x-user-id`), não mais dependendo do body do frontend
- **`src/app/api/orders/route.ts` (POST)** — `generateRepCommissions` agora é chamado quando o pedido nasce com `status = 'pago'`, igual ao comportamento já existente no PUT

### 🎨 UI
- **`src/app/dashboard/sales/page.tsx`** — coluna "Comissão" removida da lista de pedidos (exibia `commission_value` do indicador, campo incorreto para esta tela)
- **`src/app/dashboard/sales/page.tsx`** — linha "Comissão indicador" removida do resumo do modal de nova venda (comissão de indicador pertence a `/dashboard/commissions`)

### 🏗️ Arquitetura
- Separação clara confirmada: comissão de indicador → `/dashboard/commissions`; comissão de representante → `/dashboard/rep-commissions`

---

## [0.9.4] — 14/04/2026

### ✅ Correções críticas
- reforço nas rotas sensíveis
- estabilização geral do fluxo autenticado
- ajustes estruturais para ambiente de produção
- melhorias em segurança e consistência operacional

### 🔐 Segurança
- endurecimento do login
- reforço contra tentativas abusivas
- validações adicionais no backend
- melhor separação entre contexto client e server

### 🧭 Navegação e operação
- módulos principais revisados
- rotas administrativas mantidas com acesso restrito
- organização da documentação em formato mais amigável

### 🛠️ Manutenção
- melhoria no reprocessamento
- limpeza administrativa preservada
- base preparada para expansão futura

---

## 📍 Próximos itens previstos

### 🟡 Em andamento / planejado
- reprocessamento/backfill de rep_commissions para pedidos antigos sem user_id
- comissões para representantes (reprocessamento operacional)
- controle de KM
- ambientes e talhões
- evolução de relatórios analíticos

---

## 🔗 Voltar

- [📖 Central da documentação](./index.md)
- [🆕 Updates da versão 0.9.4](./updates-v094.md)
