# Sub-lote 042.1 — Cache de CEP

## Estado

Bloqueado.

## Motivo

A tabela `geocode_cache` contém `cep`, `lat`, `lng` e `updated_at`, mas a rota `/api/cep/[cep]` retorna dados de endereço. A tela de clientes consome esses campos para preencher o formulário.

## Risco

Retornar cache com `address`, `neighborhood`, `city` e `state` vazios pode apagar dados preenchidos no formulário em consultas repetidas.

## Próxima decisão exigida

Escolher entre:

1. migration para cache completo de CEP;
2. nova tabela de cache de CEP;
3. manter ViaCEP por ora;
4. usar `geocode_cache` apenas em fluxo de geocodificação, não na rota de CEP.
