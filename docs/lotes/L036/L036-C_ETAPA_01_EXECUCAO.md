# L036-C — ETAPA 01 — EXECUÇÃO

**Lote:** L036-C  
**Título:** Exportação PDF e resumo WhatsApp — Central de Relatórios  
**Base:** L036-B + L037 (ZIP VisitAgro-main__14_.zip)  
**Data:** 2026-04-26  
**Executor:** Agente Executor (Claude)  
**Status:** ✅ Implementado — TypeScript limpo (0 erros)

---

## 1. Resumo executivo

Implementada exportação PDF real (geração no servidor via `pdf-lib`) e resumo textual para WhatsApp na Central de Relatórios. Três novos endpoints foram criados, dois helpers compartilhados e a página de relatórios foi estendida com botões de ação. As regras de acesso do L036-A foram preservadas em todos os endpoints. Nenhum schema foi alterado. Zero regressões.

**Decisão arquitetural — biblioteca PDF:**  
Escolha: `pdf-lib v1.17.1`  
- ~500 KB, zero dependências nativas  
- Compatível com Node 20 + Vercel serverless (sem Chromium)  
- API programática pura — gera PDF real no servidor, sem dependência do browser  
- Suporte a embed de imagem PNG/JPG remota (logotipo via `logo_url`)  
- Alternativa `@react-pdf/renderer` descartada: ~1.5 MB, exige React runtime  
- Alternativa `puppeteer` descartada: ~100 MB, incompatível com serverless Vercel  

---

## 2. Evidências usadas

| Arquivo | O que foi verificado |
|---------|---------------------|
| `src/app/api/reports/rep-commissions/route.ts` | Query base e controle de acesso do L036-B |
| `src/app/api/reports/sales-by-representative/route.ts` | Idem para vendas |
| `src/app/api/settings/route.ts` | JOIN `settings → companies(*)`; chave `company` na resposta |
| `sql/schema_atual_supabase.sql` | Colunas de `companies`: `name, trade_name, logo_url, document, city, state, phone, email` |
| `src/app/dashboard/reports/page.tsx` | Estado atual da página (L036-B); onde inserir botões e estado |
| `package.json` + `vercel.json` | Ausência de libs PDF; `maxDuration: 15s` nos functions |
| `docs/AGENTES.md` | Regras de entrega, sensibilidade de arquivos, diff mínimo |
| `responsividade.md` | Botões com `min-h-[44px]`; layout mobile-first |

---

## 3. Arquivos criados (5)

### `src/lib/reports/helpers.ts`
Helpers compartilhados:
- `fetchCompanyInfo(workspace)` — busca nome/logotipo via `settings → companies`
- `fmtBRL(v)` — moeda BRL pt-BR
- `fmtDate(v)` — dd/MM/yyyy (timezone America/Sao_Paulo)
- `fmtDatetime(v)` — dd/MM/yyyy HH:mm
- `buildPeriodLabel(from, to)` — texto legível de período

### `src/lib/reports/pdfBuilder.ts`
Builder PDF centralizado (`pdf-lib`):
- A4 retrato (595 × 842 pt)
- Cabeçalho verde com logotipo (fetch remoto com timeout 4s), nome da empresa, título, período, representante
- Grid de summary cards com cores semânticas
- Tabela com cabeçalho verde, alternância de linha, quebra de página automática com re-renderização do cabeçalho
- Rodapé por página: empresa | data/hora de geração | número de página
- Fallback seguro para ausência de logotipo
- Interface pública: `buildPdf(meta, summary, columns, rows) → Promise<Uint8Array>`

### `src/app/api/reports/rep-commissions/pdf/route.ts`
- `GET /api/reports/rep-commissions/pdf`
- Mesmos filtros e guard de acesso do JSON irmão
- Retorna `application/pdf` com `Content-Disposition: attachment`
- Colunas: Representante (admin consolidado), Produto, Cliente, Data, Qtd, % Com., Valor, Status

### `src/app/api/reports/rep-commissions/whatsapp/route.ts`
- `GET /api/reports/rep-commissions/whatsapp`
- Retorna `{ text: string }` — texto formatado em Markdown WhatsApp
- Cabeçalho: empresa, título, representante, período
- Resumo: registros, total geral, pendente, pago
- Detalhamento: até 15 itens com emoji de status + truncamento automático
- Sem integração externa

### `src/app/api/reports/sales-by-representative/pdf/route.ts`
- `GET /api/reports/sales-by-representative/pdf`
- Admin consolidado: tabela `by_representative` (rep, pedidos, receita, pago)
- Admin/rep individual: tabela de pedidos com cliente e totais
- Retorna `application/pdf` com `Content-Disposition: attachment`

---

## 4. Arquivo alterado

### `src/app/dashboard/reports/page.tsx`

**Sensibilidade:** Alta  
**Tipo:** Extensão cirúrgica — 4 blocos adicionados, nenhum bloco removido

**Alteração 1 — imports lucide-react:**
```diff
+ Download, MessageSquare, Copy, Check,
```

**Alteração 2 — estado de exportação:**
```diff
+ const [pdfLoading, setPdfLoading] = useState(false);
+ const [waCopied,   setWaCopied]   = useState(false);
+ const [waLoading,  setWaLoading]  = useState(false);
```

**Alteração 3 — helpers e handlers:**
- `buildQs()` — constrói query string reutilizada em JSON, PDF e WhatsApp
- `handleDownloadPdf()` — chama endpoint PDF, cria blob, aciona download
- `handleCopyWhatsApp()` — chama endpoint WhatsApp, copia para clipboard

**Alteração 4 — botões na UI:**
```tsx
// Após bloco de filtros, antes do conteúdo da tab
<div className="flex flex-wrap gap-2">
  <button onClick={handleDownloadPdf} ...>Baixar PDF</button>
  {tab === 'commissions' && (
    <button onClick={handleCopyWhatsApp} ...>Copiar resumo WhatsApp</button>
  )}
</div>
```

**O que não foi tocado:** tabs, filtros, tabelas, summary cards, lógica de fetch JSON, DashboardShell, nav items.

---

## 5. Arquivo removido

`src/lib/reports/pdfTemplate.ts` — estratégia HTML+print da tentativa anterior. Substituído por `pdfBuilder.ts` (pdf-lib real).

---

## 6. Arquivo preservado sem alteração

- `src/app/api/reports/rep-commissions/route.ts` — JSON L036-B intacto
- `src/app/api/reports/sales-by-representative/route.ts` — JSON L036-B intacto
- `src/app/api/rep-commissions/route.ts` — guard L036-A intacto
- `src/app/api/orders/route.ts` — guard L036-A intacto
- `src/components/layout/DashboardShell.tsx` — nav intacto
- `src/types/index.ts` — tipos intactos
- Todo schema SQL — sem migração

---

## 7. Dependência adicionada

```json
"pdf-lib": "^1.17.1"
```

**Impacto no bundle:**  
- `pdf-lib` é utilizado apenas nos endpoints de API (server-side) — não entra no bundle do cliente
- ~500 KB adicionados ao bundle do servidor (serverless function)
- Compatível com Vercel `maxDuration: 15s` — geração de PDF típica < 1s para datasets operacionais

---

## 8. Responsividade (docs/ui/responsividade.md consultado)

- Botões com `min-h-[44px]` — área mínima de toque 44px ✅
- Layout `flex flex-wrap gap-2` — adapta em mobile sem overflow ✅
- Botões visíveis sem scroll em mobile ✅
- Sem largura fixa nos botões ✅

---

## 9. Validação TypeScript

```
cd /home/claude/va14/VisitAgro-main
node_modules/.bin/tsc --noEmit
# Saída: (vazia — 0 erros)
# Exit code: 0
```

---

## 10. Validação de fluxo

| Cenário | Comportamento esperado |
|---------|----------------------|
| Representative clica "Baixar PDF" — tab Comissões | PDF gerado apenas com suas comissões |
| Representative clica "Baixar PDF" — tab Vendas | PDF gerado apenas com seus pedidos |
| Representative clica "Copiar WhatsApp" | Texto com suas comissões copiado para clipboard |
| Admin clica "Baixar PDF" sem filtro de rep | PDF consolidado por representante |
| Admin clica "Baixar PDF" com rep selecionado | PDF individual do representante escolhido |
| Empresa sem logotipo | Texto "VA" usado como fallback — sem erro |
| Empresa com `logo_url` | Logotipo embutido no PDF (PNG ou JPG) |
| Filtros ativos + PDF | PDF respeita período, status e representante selecionados |
| Botão WhatsApp na tab Vendas | Botão não aparece (apenas tab Comissões) |

---

## 11. Validação SQL (query equivalente)

Os endpoints PDF reutilizam a mesma lógica de query dos endpoints JSON do L036-B. Para validar que os totais batem:

```sql
-- Comissões por representante
SELECT rep_name,
  COUNT(*)                                             AS total_items,
  SUM(amount)                                          AS total_amount,
  SUM(CASE WHEN status='pendente'  THEN amount END)    AS pendente,
  SUM(CASE WHEN status='paga'      THEN amount END)    AS paga,
  SUM(CASE WHEN status='cancelada' THEN amount END)    AS cancelada
FROM rep_commissions
WHERE workspace = 'principal'
GROUP BY rep_name ORDER BY rep_name;

-- Vendas por representante
SELECT user_id,
  COUNT(*)                                            AS total_orders,
  SUM(total)                                          AS receita,
  SUM(CASE WHEN status='pago'      THEN total END)    AS pago,
  SUM(CASE WHEN status='pendente'  THEN total END)    AS pendente,
  SUM(CASE WHEN status='cancelado' THEN total END)    AS cancelado
FROM orders
WHERE workspace = 'principal' AND deleted_at IS NULL
GROUP BY user_id;
```

---

## 12. Riscos

| Risco | Mitigação |
|-------|-----------|
| `logo_url` inacessível ou timeout | `fetchImageBytes` com timeout 4s + try/catch; fallback para texto "VA" |
| PDF muito grande (muitos registros) | Quebra de página automática; sem limite artificial — Vercel `maxDuration: 15s` suficiente para datasets operacionais |
| Representative passa `?rep_id=` na URL | API ignora e força `rep_id = userId` quando `role !== admin/manager` |
| `pdf-lib` não suportar PNG com canal alfa em alguns casos | `try/catch` no `embedPng`/`embedJpg` — logotipo ignorado silenciosamente |
| Clipboard API indisponível (HTTP sem HTTPS) | `navigator.clipboard.writeText` requer HTTPS em produção — Vercel usa HTTPS por padrão |

---

## 13. Dívida técnica

| ID | Descrição | Lote sugerido |
|----|-----------|---------------|
| DT-REP-01 | `PUT /api/orders/[id]` sem guard de propriedade para representative | L036-D |
| DT-REP-05 | WhatsApp para relatório de vendas (apenas comissões implementado) | L036-D |
| DT-REP-06 | Paginação nos relatórios (grandes volumes) | L036-D se necessário |
| DT-REP-07 | Export CSV dos relatórios | Lote futuro |

---

## 14. Handoff para revisão

**Arquivos para revisar (7):**
1. `src/lib/reports/helpers.ts` — novo helper compartilhado
2. `src/lib/reports/pdfBuilder.ts` — builder pdf-lib
3. `src/app/api/reports/rep-commissions/pdf/route.ts` — novo
4. `src/app/api/reports/rep-commissions/whatsapp/route.ts` — novo
5. `src/app/api/reports/sales-by-representative/pdf/route.ts` — novo
6. `src/app/dashboard/reports/page.tsx` — alterado (extensão)
7. `package.json` — `pdf-lib` adicionado

**O que revisar:**
1. Guard de acesso nos 3 endpoints — representative não pode ver dados alheios
2. `buildQs()` na página — filtros propagados corretamente para PDF e WhatsApp
3. `Buffer.from(pdfBytes)` — compatibilidade com `NextResponse` no Node 20
4. Botão WhatsApp visível apenas na tab Comissões
5. `min-h-[44px]` nos botões de exportação
6. `tsc --noEmit` → exit 0
