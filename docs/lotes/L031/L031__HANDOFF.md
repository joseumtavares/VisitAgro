# L031_rep_commissions_post_fix — HANDOFF PARA AUDITORIA

## Status
**Não liberar como lote fechado no estado atual do pacote.**

## Motivo
A ETAPA 01 documenta alterações em três arquivos, mas o ZIP entregue contém apenas um arquivo funcional (`src/lib/repCommissionHelper.ts`) e dois arquivos documentais. Permanecem sem prova de entrega:
- `src/app/api/orders/route.ts`
- `src/app/dashboard/sales/page.tsx`

## Checklist da auditoria
1. Confirmar se o patch final inclui os três arquivos funcionais prometidos.
2. Verificar se o `POST /api/orders` grava `user_id` explicitamente.
3. Verificar se o `POST /api/orders` gera `rep_commissions` quando o pedido nasce como `pago`.
4. Verificar se `/dashboard/sales` não exibe mais comissão de indicador.
5. Confirmar `npm run lint` e `npm run build`.
6. Confirmar fluxo manual completo:
   - pedido pago criado via POST
   - pedido atualizado para pago via PUT
   - exibição correta em `/dashboard/rep-commissions`
   - exibição correta em `/dashboard/commissions`

## Observação importante
O schema atual já suporta a feature; portanto, a pendência é de **patch incompleto / não empacotado**, não de banco.
