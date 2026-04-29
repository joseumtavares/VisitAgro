# L031_rep_commissions_post_fix — ETAPA 03 AUDITORIA

## Classificação geral
**correção obrigatória pendente**

## Veredito
- Helper `src/lib/repCommissionHelper.ts`: ✅ aprovado (isolado e aderente)
- Pacote completo como entregue: ❌ incompleto — retornar ao executor

## Correções obrigatórias para liberação
1. Incluir no ZIP os arquivos ausentes prometidos na ETAPA 01:
   - `src/app/api/orders/route.ts` (patch aplicado)
   - `src/app/dashboard/sales/page.tsx` (patch aplicado)
2. Em `POST /api/orders`:
   - Persistir `user_id` explicitamente
   - Chamar `generateRepCommissions` quando `status === 'pago'`
3. Em `/dashboard/sales`:
   - Remover `commission_value` do payload
   - Ocultar coluna/resumo "Comissão indicador"
4. Corrigir documentação da ETAPA 01: `rep_id`/`rep_name` estão em `rep_commissions`, não em `orders`
5. Registrar esta ETAPA 03 em `docs/lotes/`

## Melhorias opcionais (não bloqueiam)
- Hardening de filtros `workspace`/`deleted_at` no helper
- Anexar logs de `npm run lint/build`

## Proteções obrigatórias
- Preservar fluxo de `PUT /api/orders/[id]` para geração de rep_commissions
- Preservar restrição de acesso em `/api/rep-commissions`
- Manter separação entre `/dashboard/commissions` e `/dashboard/rep-commissions`
- Não introduzir migration nova sem evidência

## Validação mínima para liberação
- [ ] `npm run lint` sem erros
- [ ] `npm run build` sem erros
- [ ] Fluxo A: pedido pago criado via POST gera linha em `rep_commissions`
- [ ] Fluxo B: PUT para `pago` continua gerando `rep_commissions`
- [ ] Fluxo C: `/dashboard/sales` não exibe comissão de indicador

## Handoff
Retornar ao executor com este escopo delimitado. Não reabrir módulos adjacentes.