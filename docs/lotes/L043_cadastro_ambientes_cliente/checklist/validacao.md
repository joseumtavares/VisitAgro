# Checklist de validação — L043 cadastro_ambientes_cliente

## Base documental

- [ ] `AGENTES.md` lido e respeitado.
- [ ] `docs/playbook-operacional.md` lido e respeitado.
- [ ] `docs/index.md` consultado para pontos de atualização.
- [ ] `docs/changelog.md` consultado para histórico e pendências.
- [ ] `docs/ui/responsividade.md` aplicado porque há frontend/UI.
- [ ] `docs/padrao_de_comentarios.md` aplicado na implementação futura.
- [ ] `sql/schema_atual_supabase.sql` validado contra banco real.

## Validação de schema e rotas

- [ ] Confirmar se `public.environments` existe no Supabase real.
- [ ] Confirmar campos: `id`, `workspace`, `client_id`, `name`, `area`, `area_unit`, `obs`, `lat`, `lng`, `drawing`, `active`, `created_at`, `updated_at`.
- [ ] Confirmar FK `orders.environment_id -> environments.id`.
- [ ] Confirmar se já existem rotas ou componentes de ambientes no código real.
- [ ] Declarar migration somente se houver divergência, índice ausente ou necessidade de campo explícito.

## API

- [ ] `GET /api/clients/[id]/environments` lista apenas ambientes do cliente e workspace atual.
- [ ] `POST /api/clients/[id]/environments` cria ambiente com `workspace`, `client_id` e `active = true`.
- [ ] `PUT /api/environments/[id]` atualiza apenas ambiente do workspace atual.
- [ ] `DELETE /api/environments/[id]` desativa com `active = false`, sem delete físico.
- [ ] Rotas usam `getRequestContext(req)`.
- [ ] Rotas usam `getAdmin()` com filtro explícito de `workspace`.
- [ ] Mutações registram `auditLog` quando aplicável.
- [ ] Backend valida que `environment_id` pertence ao mesmo `client_id` e `workspace` no fluxo de venda.

## UI — clientes e ambientes

- [ ] `src/app/dashboard/clients/page.tsx` recebe ação “Ambientes” sem quebrar editar/remover.
- [ ] Página de ambientes usa `DashboardShell` e `apiFetch`.
- [ ] Estado vazio exibe CTA “Novo ambiente”.
- [ ] Formulário exige nome do ambiente.
- [ ] Formulário permite medidas/área, unidade, observações e desenho/preview opcional.
- [ ] Ambiente ativo pode ser editado.
- [ ] Ambiente pode ser desativado sem apagar fisicamente.

## UI — vendas

- [ ] Ao selecionar cliente, carregar/listar apenas ambientes ativos daquele cliente.
- [ ] Select de ambiente é opcional, salvo se regra de negócio futura tornar obrigatório.
- [ ] Ao trocar cliente, limpar `environment_id` anterior.
- [ ] Pedido salvo mantém regras existentes: cliente obrigatório, representante obrigatório, indicador opcional.

## Responsividade

- [ ] Testado em 375px — sem overflow horizontal.
- [ ] Testado em 768px — layout intermediário coerente.
- [ ] Testado em ≥1024px — desktop preservado.
- [ ] Cards mobile ou scroll controlado quando houver tabela/lista.
- [ ] Formulários em coluna única no mobile.
- [ ] Botões e ações com área mínima de toque de 44px.
- [ ] Filtros e selects acessíveis em tela pequena.

## Build e regressão

- [ ] `npm run lint` executado ou exceção documentada.
- [ ] `npm run build` executado ou exceção documentada.
- [ ] CRUD de clientes existente continua funcionando.
- [ ] CRUD de vendas existente continua funcionando.
- [ ] Regras L036 de representante obrigatório preservadas.
- [ ] Indicador continua opcional.
- [ ] Nenhum arquivo sensível foi reescrito por completo.
