# Changelog

[Central da documentação](./index.md) · [Release 0.9.4](./updates-v094.md) · [Auditoria técnica](./auditoria-tecnica.md)

---

## Histórico de versões

### v0.9.4 — 14/04/2026

**Foco:** estabilização de runtime, segurança e alinhamento entre schema e código.

Principais frentes:

- seed obrigatório de `workspaces` no `insert_admin.sql`
- endurecimento do login com proteção contra brute-force
- restrição de acesso aos logs administrativos
- correções de escopo de workspace
- proteção de `service_role` com `server-only`
- ajustes no `apiFetch` e em telas do dashboard
- atualização de tipos públicos

### v0.9.3 — 10/04/2026

**Foco:** build, runtime e usabilidade operacional.

Destaques:

- criação da rota de visitas que faltava
- correção do erro `Unexpected token '<'`
- melhorias no check-in e no mapa
- inclusão de categorias em Configurações

### v0.9.2 — 09/04/2026

**Foco:** segurança e estabilidade de requests autenticadas.

Destaques:

- verificação de assinatura HMAC-SHA256 no middleware
- remoção de segredo hardcoded
- substituição de `fetch()` por `apiFetch()` em áreas críticas
- correções de race condition e hydration

### v0.9.1 — 08/04/2026

Versão inicial funcional com:

- login
- clientes
- produtos
- vendas
- mapa
- comissões

## Como manter este changelog bonito

Use o padrão abaixo para as próximas versões:

```md
## [x.y.z] — AAAA-MM-DD
### Adicionado
- item

### Alterado
- item

### Corrigido
- item

### Segurança
- item
```

## Dica de organização

Mantenha este documento como histórico global e use páginas separadas de release apenas quando uma versão exigir explicações mais profundas, como foi o caso da `0.9.4`.
