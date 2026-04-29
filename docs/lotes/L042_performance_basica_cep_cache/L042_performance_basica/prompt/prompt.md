# Prompt — L042 Performance Básica — Diagnóstico de Desbloqueio

Você é o **Agente 02 — Diagnóstico Técnico de Desbloqueio** do repositório VisitAgro.

## Objetivo

Resolver o bloqueio documental/técnico do L042 antes de qualquer implementação.

## Contexto obrigatório

O lote pretendia implementar cache em:

```text
src/app/api/cep/[cep]/route.ts
```

A proposta inicial era consultar a tabela:

```text
geocode_cache(cep, lat, lng, updated_at)
```

antes de chamar ViaCEP.

## Bloqueio encontrado

A rota atual `/api/cep/[cep]` retorna dados de endereço:

```json
{
  "zip_code": "...",
  "address": "...",
  "neighborhood": "...",
  "city": "...",
  "state": "..."
}
```

A tabela `geocode_cache` possui apenas coordenadas (`lat`, `lng`) e não possui endereço, bairro, cidade ou UF.

A tela `src/app/dashboard/clients/page.tsx` consome `/api/cep/${cep}` para preencher `address`, `city`, `state` e `zip_code`.

Portanto, o patch sugerido originalmente, que retorna campos vazios quando encontra cache, pode causar regressão no formulário de clientes.

## Sua tarefa

1. Ler obrigatoriamente:
   - `AGENTES.md`
   - `docs/playbook-operacional.md`
   - `docs/index.md`
   - `docs/changelog.md`
   - `docs/padrao_de_comentarios.md`
   - `src/app/api/cep/[cep]/route.ts`
   - `src/app/dashboard/clients/page.tsx`
   - `src/lib/supabaseAdmin.ts`
   - `sql/schema_atual_supabase.sql` ou schema equivalente atual

2. Responder com uma das decisões:
   - **Opção A:** cache completo de CEP, exigindo migration para guardar endereço.
   - **Opção B:** não usar `geocode_cache` em `/api/cep/[cep]`; manter ViaCEP e adiar cache.
   - **Opção C:** criar nova tabela específica para cache de CEP.
   - **Opção D:** outra solução, desde que preserve contrato e tenha validação.

3. Não implementar código ainda se a decisão exigir migration ou alteração de contrato.

## Regras obrigatórias

- Não alterar `src/lib/supabaseAdmin.ts`.
- Não alterar frontend neste lote, salvo se nova abertura formal permitir.
- Não devolver `address`, `city` ou `state` vazios em cache hit se isso apagar dados do cliente.
- Não mexer no dashboard nem implementar `?fields=` neste lote.
- Qualquer uso de `getAdmin()` deve respeitar `docs/padrao_de_comentarios.md`.
- Se houver migration, declarar:
  - arquivo SQL incremental;
  - patch documental;
  - atualização de `docs/index.md`;
  - atualização de `docs/changelog.md`.

## Saída esperada

- Diagnóstico técnico.
- Decisão recomendada.
- Arquivos afetados.
- Riscos.
- Validação mínima.
- Se aplicável, nova proposta de lote desbloqueado.
