# Checklist de Validação — L040.1_controle_km

## Base documental

- [ ] `AGENTES.md` relido antes do mapa de impacto.
- [ ] `docs/playbook-operacional.md` relido antes do mapa de impacto.
- [ ] `docs/ui/responsividade.md` relido antes de qualquer UI.
- [ ] `sql/schema_atual_supabase.sql` conferido contra banco real.
- [ ] Ausência/presença de `workspace` em `km_logs` registrada.
- [ ] Ausência de rota `src/app/api/km-logs` confirmada.
- [ ] Ausência de página `src/app/dashboard/km` confirmada.

## Banco / schema

- [ ] Migration incremental definida, se necessária.
- [ ] `km_logs.workspace` decidido e documentado.
- [ ] Índices por `workspace`, `user_id`, `data` avaliados.
- [ ] Unicidade diária ativa avaliada.
- [ ] `deleted_at` preservado para soft delete.
- [ ] Nenhum schema inteiro reescrito.

## API

- [ ] `GET /api/km-logs` filtra por workspace/perfil/período.
- [ ] `POST /api/km-logs` calcula `percorrido`.
- [ ] `POST /api/km-logs` rejeita `km_fim < km_ini`.
- [ ] `POST /api/km-logs` impede duplicidade diária.
- [ ] `PUT /api/km-logs/[id]` recalcula `percorrido`.
- [ ] `PUT /api/km-logs/[id]` bloqueia edição cruzada por representative.
- [ ] `DELETE /api/km-logs/[id]` aplica soft delete.
- [ ] Mutações relevantes usam `auditLog`.

## UI

- [ ] Página `/dashboard/km` criada apenas se a API estiver definida.
- [ ] Formulário em coluna única no mobile.
- [ ] Cards mobile para listagem.
- [ ] Tabela desktop preservada.
- [ ] Filtros por período acessíveis em telas pequenas.
- [ ] Filtro por representante aparece apenas para admin/manager.
- [ ] Botões principais com área mínima de 44px.
- [ ] Sem overflow horizontal em 375px.
- [ ] Layout coerente em 768px.
- [ ] Desktop preservado em ≥1024px.

## Regressão

- [ ] `DashboardShell` alterado com diff mínimo.
- [ ] Navegação existente preservada.
- [ ] Login/auth não alterados.
- [ ] `apiFetch` não alterado.
- [ ] Comissões e pedidos não alterados.
- [ ] `npm run lint` validado.
- [ ] `npm run build` validado.

## Documentação

- [ ] `docs/patches/060_controle_km_logs.md` criado.
- [ ] `docs/index.md` atualizado.
- [ ] `docs/changelog.md` atualizado.
- [ ] Registro do lote atualizado em `docs/lotes/`.
