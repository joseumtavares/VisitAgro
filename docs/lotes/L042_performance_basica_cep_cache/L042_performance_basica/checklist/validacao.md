# Checklist de Validação — L042 Performance Básica

## Estado atual

- [x] Lote analisado em ETAPA_00
- [x] Base documental consultada
- [x] Conflito documental identificado
- [x] Sub-lote 042.1 registrado como bloqueado
- [x] Sub-lote 042.2 registrado como adiado
- [ ] Lote liberado para execução

## Desbloqueio obrigatório

- [ ] Confirmar se `geocode_cache` deve ser usado para CEP ou apenas para geocodificação.
- [ ] Confirmar se o cache precisa devolver `address`, `neighborhood`, `city` e `state`.
- [ ] Decidir se haverá migration SQL para adicionar campos de endereço.
- [ ] Garantir que `/dashboard/clients` não receberá campos vazios no segundo lookup.
- [ ] Definir se `_cached: true` será parte oficial do contrato da rota.

## Validação técnica futura

- [ ] `GET /api/cep/123` retorna 400.
- [ ] Primeira consulta a CEP válido retorna dados completos.
- [ ] Segunda consulta ao mesmo CEP não apaga `address`, `city` ou `state`.
- [ ] Se houver cache, `_cached: true` aparece apenas em hit real.
- [ ] Falha de gravação do cache não bloqueia resposta ao usuário.
- [ ] `npm run lint` finaliza sem erro.
- [ ] `npm run build` finaliza sem erro.

## Documentação futura

- [ ] Criar/atualizar `docs/patches/L042_cache_cep.md`.
- [ ] Atualizar `docs/index.md`.
- [ ] Atualizar `docs/changelog.md`.
- [ ] Registrar fechamento em `docs/lotes/`.
