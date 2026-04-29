# Sub-lote 042.2 — Otimização de Query no Dashboard

## Estado

Adiado.

## Motivo

A proposta depende de suporte a `?fields=` nas APIs atuais. Implementar isso dentro do L042 ampliaria o escopo para múltiplas rotas e contratos de API.

## Fora do L042

- `src/app/dashboard/page.tsx`
- `/api/clients?fields=...`
- `/api/products?fields=...`
- `/api/orders?fields=...`
- `/api/commissions?fields=...`
- `/api/referrals?fields=...`

## Recomendação

Reavaliar em lote posterior, preferencialmente L044, com abertura própria para contrato `fields` ou endpoints de contagem/KPI.
