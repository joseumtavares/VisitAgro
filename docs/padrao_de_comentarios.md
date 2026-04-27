# Padrão de Comentários — VisitAgro v3.0

> **Leia também:** [`AGENTES.md`](../AGENTES.md) — regras de integração e entrega de código.  
> **Stack:** Next.js 14 App Router · TypeScript strict · Supabase (service role) · Zustand · Leaflet · Tailwind · Vercel

---

## Princípio Central

**Código bom explica o quê. Comentário bom explica o porquê.**

Se o nome da função ou variável já responde "o que isso faz?", o comentário é desnecessário.  
Se a resposta for "não sei por que está assim" ou "parece errado mas não é", o comentário é obrigatório.

**Regra Final:** Se um código pode quebrar o sistema e não tem comentário → está errado.

---

## Quando comentar (obrigatório)

Você DEVE comentar quando houver:

- Regra de negócio (cálculo financeiro, comissão, status)
- Segurança (auth, service role, validação de acesso)
- Dependências implícitas (workspace, soft delete, Zustand)
- Efeitos colaterais (auditLog, triggers, integrações externas)
- Decisões de arquitetura não óbvias
- Qualquer trecho que um agente de IA possa alterar erroneamente

## Quando não comentar

NÃO comentar quando o nome já é suficiente:

```ts
// ❌ Comentário óbvio — o nome já diz tudo
// Busca pedidos do workspace
async function getOrdersByWorkspace(workspace: string) { ... }

// ✅ Sem comentário — nome autoexplicativo
async function getOrdersByWorkspace(workspace: string) { ... }
```

```ts
// ❌ Comentário que repete o código
// Verifica se está autenticado e redireciona
if (!isAuthenticated) router.push('/auth/login');

// ✅ Sem comentário — a lógica é direta
if (!isAuthenticated) router.push('/auth/login');
```

---

## Vocabulário Oficial (obrigatório)

Use exatamente estas tags, em maiúsculo, seguidas de dois-pontos:

| Tag | Quando usar |
|-----|------------|
| `// CRITICAL:` | Risco de segurança, integridade de dados ou quebra do sistema |
| `// WARNING:` | Comportamento não óbvio que pode causar bug se alterado sem contexto |
| `// CONTEXT:` | Explica decisão de negócio ou arquitetural que o código não deixa claro |
| `// SIDE-EFFECT:` | Efeito fora do escopo direto da função (log, trigger, integração) |
| `// TODO:` | Melhoria conhecida, pendente, com baixo risco imediato |
| `// FIXME:` | Bug conhecido com workaround ativo, precisa de correção |
| `// DEPRECATED:` | Caminho de código a ser removido; indicar substituto |
| `// AI-CONTEXT:` | Contexto que um agente precisa para entender este trecho |
| `// AI-CONTRACT:` | Contrato de dados que não pode mudar sem alinhar consumidores |
| `// AI-RULE:` | Restrição explícita que o agente deve respeitar ao alterar este trecho |

---

## Padrões Core do VisitAgro

Estes comentários são obrigatórios sempre que os padrões abaixo se aplicarem.

### Workspace (multi-tenancy)

```ts
// CRITICAL: Toda query deve filtrar por workspace.
// getAdmin() usa service_role — RLS não se aplica aqui.
const { data } = await getAdmin()
  .from('orders')
  .eq('workspace', workspace)   // ← obrigatório
  .is('deleted_at', null);      // ← obrigatório (soft delete)
```

### Soft Delete

```ts
// CRITICAL: Sempre incluir .is('deleted_at', null) em listagens.
// Registros deletados são preservados para auditoria — nunca usar DELETE físico.
.is('deleted_at', null)
```

### Service Role

```ts
// CRITICAL: getAdmin() ignora RLS completamente.
// Filtros de workspace, deleted_at e autorização são responsabilidade da rota.
// AI-RULE: Nunca chamar getAdmin() sem filtro de workspace em tabelas multi-tenant.
const admin = getAdmin();
```

### Audit Log

```ts
// SIDE-EFFECT: Gera registro em audit_log.
// Erros são silenciados intencionalmente — auditoria não pode quebrar o fluxo principal.
await auditLog('[VENDA] Pedido criado', { order_id: orderId, workspace }, userId);
```

### Hydration Guard (Zustand + Next.js)

```ts
// CONTEXT: Zustand rehidrata localStorage de forma assíncrona.
// Sem este guard, isAuthenticated lê como false no primeiro render
// e dispara redirect indevido para usuários já autenticados.
const [hydrated, setHydrated] = useState(false);
useEffect(() => { setHydrated(true); }, []);
```

### Destructure antes de INSERT (Supabase)

```ts
// CRITICAL: Supabase rejeita colunas relacionais no payload da tabela pai.
// items e payment_type não existem em orders — devem ser removidos antes do insert.
const { items: _items, payment_type: _pt, ...orderData } = body;
```

---

## JSDoc — Obrigatório para funções públicas e rotas API

### Helpers (`src/lib/`)

```ts
/**
 * Gera comissão para o indicador vinculado ao pedido.
 *
 * CONTEXT:
 * Executado automaticamente quando pedido muda para status "pago".
 * Chamado por: POST /api/orders, PUT /api/orders/[id], POST /api/admin/reprocess
 *
 * SIDE-EFFECT:
 * Insere linha em `commissions` via service role.
 *
 * @param admin  Cliente Supabase com service_role (getAdmin())
 * @param order  Linha completa do pedido (referral_id, client_id, workspace obrigatórios)
 * @param amount Valor em reais já calculado pelo caller
 */
export async function generateCommission(
  admin: SupabaseClient,
  order: any,
  amount: number
): Promise<void> { ... }
```

### Rotas API (`src/app/api/**/route.ts`)

```ts
/**
 * POST /api/orders
 *
 * CONTEXT:
 * Cria pedido com itens. Calcula comissão do indicador automaticamente
 * se referral_id for informado e o pedido já iniciar com status "pago".
 *
 * Body:     { client_id (obrigatório), items[], referral_id?, status?, total, ... }
 * Resposta: 201 { order: Order }
 * Erros:    400 { error } | 500 { error }
 *
 * Tabelas escritas: orders, order_items
 * SIDE-EFFECT: auditLog "[VENDA] Pedido criado"
 * SIDE-EFFECT: generateCommission() se status = "pago" e referral presente
 *
 * AI-CONTRACT:
 * Retorna { order } com id, total, status, commission_value, created_at.
 * Consumido por: src/app/dashboard/sales/page.tsx (lista de pedidos)
 * NÃO ALTERAR estrutura de retorno sem alinhar o frontend.
 */
export async function POST(req: NextRequest) { ... }
```

### Componentes React (`src/app/dashboard/**`)

Componentes de página não precisam de JSDoc completo. Comente seções não triviais:

```tsx
// ── Carregamento paralelo ──────────────────────────────────────────
// Produtos e categorias são independentes — carregar em paralelo
// reduz o tempo total de mount do modal de novo pedido.
const [rp, rc] = await Promise.all([
  apiFetch('/api/products').then(r => r.json()),
  apiFetch('/api/categories').then(r => r.json()),
]);

// ── useSearchParams (Next.js 14) ───────────────────────────────────
// CONTEXT: Lê ?lat, ?lng, ?maps_link enviados pelo InteractiveMap
// ao clicar em "📌 Novo Lead aqui". Deve ficar dentro de <Suspense>
// — requisito do Next.js 14 App Router para useSearchParams.
```

---

## Padrão AI-CONTEXT / AI-CONTRACT / AI-RULE

Use quando um trecho tiver restrições que um agente não infere apenas lendo o código.

### Formato

```ts
// AI-CONTEXT: <o que é e por que existe>
// AI-CONTRACT: <o que não pode mudar e quem consome>
// AI-RULE:    <o que o agente deve ou não fazer aqui>
// AI-REF:     <arquivo ou seção de referência>
```

### Exemplos reais do VisitAgro

```ts
// AI-CONTEXT: Validação JWT manual — Edge Runtime não suporta jsonwebtoken.
// AI-RULE:    Não substituir por jsonwebtoken sem verificar compatibilidade Vercel Edge.
//             Qualquer mudança aqui afeta TODAS as rotas protegidas.
// AI-REF:     docs/auditoria-tecnica.md — Problema 1
const valid = await crypto.subtle.verify('HMAC', cryptoKey, ...);
```

```ts
// AI-CONTEXT: apiFetch injeta Authorization lendo o Zustand store automaticamente.
// AI-RULE:    Nunca adicionar header Authorization manualmente em chamadas de dashboard.
//             Fazê-lo pode sobrescrever o token ou duplicar lógica.
// AI-REF:     src/lib/apiFetch.ts
const r = await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
```

```ts
// AI-CONTEXT: Tabela refresh_tokens existe no schema mas a feature não está implementada.
// AI-RULE:    Não gerar lógica de refresh token sem coordenar API + frontend + authStore.
// AI-REF:     sql/schema_atual_v094_supabase.sql ~linha 272, auditoria DT01
```

```ts
// AI-CONTEXT: MapContainer do Leaflet não suporta remount por mudança de estado.
// AI-RULE:    A prop key="main-map" deve ser estável (string literal, nunca dinâmica).
//             Torná-la dinâmica causa crash ao salvar coordenadas no check-in.
<MapContainer key="main-map" center={SC_CENTER} zoom={9} ... />
```

```ts
// AI-CONTRACT:
// getOrdersByWorkspace retorna { id, order_number, total, status, commission_value, clients, referrals }
// Consumido por: src/app/dashboard/sales/page.tsx (tabela de vendas)
//               src/app/dashboard/page.tsx (cards de KPI)
// NÃO ALTERAR nomes de campos sem atualizar os dois consumidores acima.
```

---

## Comentários de Arquitetura (topo de arquivo)

Use no topo de arquivos que implementam padrões não triviais:

```ts
/**
 * src/middleware.ts
 *
 * CONTEXT:
 * Valida JWT em todas as requisições /api/* exceto PUBLIC_PATHS.
 * Usa crypto.subtle (Web Crypto API) em vez de jsonwebtoken porque
 * o middleware roda no Edge Runtime do Vercel — Node.js não disponível.
 *
 * SIDE-EFFECT:
 * Injeta x-user-id, x-user-name, x-user-role, x-workspace em cada request.
 * Consumido por: src/lib/requestContext.ts (getRequestContext)
 *
 * CRITICAL:
 * Alterações aqui afetam todas as rotas protegidas simultaneamente.
 */
```

```ts
/**
 * src/lib/commissionHelper.ts
 *
 * CONTEXT:
 * Helper isolado para geração de comissões de indicadores.
 * Separado das rotas para reutilização sem duplicar lógica.
 *
 * Chamado por:
 *   POST /api/orders (criação com status pago)
 *   PUT  /api/orders/[id] (mudança de status para pago)
 *   POST /api/admin/reprocess (reprocessamento manual)
 */
```

---

## Delimitadores de Seção

Para arquivos com mais de ~150 linhas:

```ts
// ── Types ──────────────────────────────────────────────────────────
// ── Constants ──────────────────────────────────────────────────────
// ── Helpers ────────────────────────────────────────────────────────
// ── Component ──────────────────────────────────────────────────────
// ── Subcomponents ──────────────────────────────────────────────────
```

Para rotas API com múltiplos verbos:

```ts
// ─── GET /api/orders ───────────────────────────────────────────────
export async function GET(req: NextRequest) { ... }

// ─── POST /api/orders ──────────────────────────────────────────────
export async function POST(req: NextRequest) { ... }
```

---

## Código Obsoleto

```ts
/**
 * @deprecated Usar apiFetch() de src/lib/apiFetch.ts.
 * Este fetch manual não injeta o token JWT e falha silenciosamente
 * em rotas protegidas retornando 401 sem mensagem de erro clara.
 */
```

---

## Comentários Proibidos

Remover se encontrados em code review:

```ts
// ❌ Comentário óbvio
// Retorna o usuário
function getUser() { ... }

// ❌ Comentário desatualizado (pior que não ter)
// Busca clientes por status
// (função foi alterada; agora filtra por workspace + status)

// ❌ Travamento sem contexto
// Não mexer aqui!

// ❌ Ruído sem informação
// Aqui começa o código principal

// ❌ Obrigatório vazio (contradiz o princípio 1)
// Segue padrão docs/padrao_de_comentarios.md
```

---

## Sobre Testes

O projeto atualmente não possui testes automatizados.

Enquanto isso não mudar:

- Comentários substituem parcialmente a documentação de comportamento
- Regras críticas e contratos de dados devem estar documentados em código
- `AI-CONTRACT` desempenha o papel que um teste de integração desempenharia

Quando testes forem implementados:

- Comentários descritivos de comportamento devem migrar para os testes
- Permanecem obrigatórios: CRITICAL, WARNING, CONTEXT, AI-CONTEXT, AI-CONTRACT, AI-RULE

---

## Checklist para Code Review

- [ ] Funções públicas em `src/lib/` têm JSDoc com `@param`, contexto e side-effects
- [ ] Rotas API têm cabeçalho com body, resposta, erros, tabelas e side-effects
- [ ] Uso de `getAdmin()` tem filtro `workspace` e `deleted_at` visíveis ou comentados
- [ ] Hydration guards têm `// CONTEXT:` explicando o motivo
- [ ] `CRITICAL:` / `WARNING:` aplicados onde há risco real de quebra
- [ ] `AI-CONTRACT:` presente em retornos consumidos por múltiplos pontos do frontend
- [ ] Nenhum comentário óbvio, desatualizado ou redundante
- [ ] Arquivos longos têm delimitadores de seção

---

## Referências Cruzadas

| Documento | Relação |
|-----------|---------|
| [`AGENTES.md`](../AGENTES.md) | Regras de entrega; este documento define como o código dentro da entrega é comentado |
| [`docs/auditoria-tecnica.md`](auditoria-tecnica.md) | TODO/FIXME devem referenciar IDs da auditoria (ex: DT03) |
| [`docs/playbook-operacional.md`](playbook-operacional.md) | AI-CONTEXT é a interface entre o playbook e o código |
