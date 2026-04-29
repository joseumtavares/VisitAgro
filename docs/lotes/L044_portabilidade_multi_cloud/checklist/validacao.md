# Checklist de Validação — L044 Portabilidade Multi-Cloud

## Antes da execução

- [ ] Confirmar leitura de `AGENTES.md`.
- [ ] Confirmar leitura de `docs/playbook-operacional.md`.
- [ ] Confirmar leitura de `docs/index.md`.
- [ ] Confirmar leitura de `docs/changelog.md`.
- [ ] Confirmar leitura de `docs/ui/responsividade.md` e registrar como não aplicável por não haver UI.
- [ ] Confirmar leitura de `docs/padrao_de_comentarios.md` v3.0.
- [ ] Confirmar que `Dockerfile` não existe antes de criar.
- [ ] Confirmar que `.dockerignore` não existe antes de criar.
- [ ] Confirmar que `src/lib/config.ts` não existe antes de criar.

## Sub-lote 044.1 — Dockerfile

- [ ] Criar `Dockerfile` na raiz.
- [ ] Usar `node:20-alpine` em todos os estágios.
- [ ] Usar `npm ci` no estágio `deps`.
- [ ] Copiar `node_modules` do estágio `deps` para `builder`.
- [ ] Definir `NEXT_TELEMETRY_DISABLED=1`.
- [ ] Definir `DOCKER_BUILD=true` no estágio `builder` antes de `npm run build`.
- [ ] Criar usuário não-root no estágio `runner`.
- [ ] Copiar `public`, `.next/standalone` e `.next/static`.
- [ ] Expor porta `3000`.
- [ ] Usar `CMD ["node", "server.js"]`.
- [ ] Criar `.dockerignore` com `node_modules`, `.next`, `.env*.local`, `.git`.

## Sub-lote 044.2 — Configuração Centralizada

- [ ] Criar `src/lib/config.ts`.
- [ ] Garantir validação lazy: nenhum `throw` deve ocorrer apenas por importar o arquivo.
- [ ] Incluir `config.supabase.url()`.
- [ ] Incluir `config.supabase.anonKey()`.
- [ ] Incluir `config.supabase.serviceRoleKey()`.
- [ ] Incluir `config.jwt.secret()`.
- [ ] Incluir `config.jwt.expiresIn()` com fallback `28800`.
- [ ] Incluir `config.app.baseUrl()` com fallback `http://localhost:3000`.
- [ ] Incluir `config.app.isProd()`.
- [ ] Não substituir `src/lib/supabase.ts`.
- [ ] Não substituir `src/lib/auth.ts`.
- [ ] Atualizar `.env.example` apenas ao final.

## Documentação

- [ ] Criar `docs/patches/L044_portabilidade_multi_cloud.md`.
- [ ] Atualizar `docs/index.md` com referência ao patch/lote L044.
- [ ] Atualizar `docs/changelog.md` com entrada L044.
- [ ] Registrar que não houve migration SQL.
- [ ] Registrar que não houve alteração de UI/responsividade.

## Validação técnica

- [ ] Rodar `npm run build` com `DOCKER_BUILD` ausente ou `false`.
- [ ] Confirmar que build padrão não exige `.next/standalone`.
- [ ] Rodar `DOCKER_BUILD=true npm run build` se for validar standalone fora do Docker.
- [ ] Rodar `docker build -t visitagro .`.
- [ ] Confirmar que a etapa `runner` encontra `.next/standalone`.
- [ ] Rodar `docker run --rm -p 3000:3000 --env-file .env.local visitagro`.
- [ ] Confirmar que a aplicação responde em `http://localhost:3000`.
- [ ] Validar que erro de variável obrigatória é explícito quando função lazy é chamada sem env.

## Critérios de reprovação

- [ ] Dockerfile sem `DOCKER_BUILD=true` no build.
- [ ] `next.config.mjs` alterado de forma ampla sem necessidade.
- [ ] `.env.example` reescrito ou com variáveis existentes removidas.
- [ ] `config.ts` lendo variável obrigatória no topo do módulo.
- [ ] Alteração em banco, API, UI, middleware ou autenticação.
- [ ] Documentação não atualizada.
