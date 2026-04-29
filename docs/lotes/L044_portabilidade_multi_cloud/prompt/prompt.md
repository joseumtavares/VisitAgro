# Prompt — Agente 02 — Executor de Patch Multi-Cloud — L044

Você é o **Agente 02 — Executor de Patch Multi-Cloud** do repositório VisitAgro.

Seu papel é propor **patch mínimo seguro** para o lote abaixo. Não amplie escopo.

## Lote

```text
lote_id : L044
slug    : portabilidade_multi_cloud
título  : Portabilidade multi-cloud com Docker standalone e configuração centralizada
estado  : aberto
```

## Leitura obrigatória antes de qualquer patch

Leia nesta ordem:

1. `AGENTES.md`
2. `docs/playbook-operacional.md`
3. `docs/index.md`
4. `docs/changelog.md`
5. `docs/ui/responsividade.md` — registrar como não aplicável, pois não há UI/layout
6. `docs/padrao_de_comentarios.md` — usar a versão real do repositório
7. `next.config.mjs`
8. `.env.example`
9. `package.json`
10. `src/lib/supabase.ts`
11. `src/lib/auth.ts`
12. `src/lib/supabaseAdmin.ts`

## Escopo permitido

### Sub-lote 044.1 — Dockerfile

Criar:

```text
Dockerfile
.dockerignore
```

Alterar:

```text
next.config.mjs
```

Regras:

- Criar Dockerfile multi-stage para Next.js 14 e Node 20.
- Usar `node:20-alpine`.
- Usar `npm ci`.
- Build deve gerar `.next/standalone`.
- Como `next.config.mjs` terá `output` condicional por `DOCKER_BUILD`, o Dockerfile precisa definir `DOCKER_BUILD=true` antes do build.
- Não mexer em Vercel, middleware, API, banco ou UI.

Dockerfile base esperado, com ajuste obrigatório de `DOCKER_BUILD=true`:

```dockerfile
# Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=true
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

`.dockerignore` esperado:

```text
node_modules
.next
.env*.local
.git
```

Alteração esperada em `next.config.mjs`:

- Âncora: `const nextConfig = {`
- Substituir somente o objeto de configuração.
- Resultado esperado:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
};

export default nextConfig;
```

### Sub-lote 044.2 — Configuração Centralizada

Criar:

```text
src/lib/config.ts
```

Conteúdo esperado:

```typescript
// src/lib/config.ts
// Não substituir supabase.ts nem auth.ts — apenas centralizar

export const config = {
  supabase: {
    url: (): string => {
      const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!v) throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada');
      return v;
    },
    anonKey: (): string => {
      const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!v) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada');
      return v;
    },
    serviceRoleKey: (): string => {
      const v = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!v) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
      return v;
    },
  },
  jwt: {
    secret: (): string => {
      const v = process.env.JWT_SECRET;
      if (!v) throw new Error('JWT_SECRET não configurada');
      return v;
    },
    expiresIn: (): number =>
      parseInt(process.env.JWT_EXPIRES_IN || '28800', 10),
  },
  app: {
    baseUrl: (): string =>
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    isProd: (): boolean => process.env.NODE_ENV === 'production',
  },
} as const;
```

Alterar `.env.example`:

- Inserir ao final, sem remover nada existente:

```bash
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
DOCKER_BUILD=false
```

## Atualização documental obrigatória

Criar/alterar:

```text
docs/patches/L044_portabilidade_multi_cloud.md
docs/index.md
docs/changelog.md
```

A documentação deve registrar:

- Dockerfile multi-stage criado.
- `.dockerignore` criado.
- `next.config.mjs` agora suporta `standalone` apenas quando `DOCKER_BUILD` estiver ativo.
- `src/lib/config.ts` criado com validação lazy.
- `.env.example` atualizado.
- Sem migration SQL.
- Sem alteração de UI/responsividade.
- Sem alteração de API, auth, middleware ou banco.

## Fora de escopo

Não fazer:

- Migration SQL.
- Docker Compose.
- GitHub Actions.
- Terraform/Kubernetes/Helm.
- Migração de Supabase para outro banco.
- Alteração em middleware, auth, API, UI ou layout.
- Refatoração global de `process.env`.
- Remoção de Vercel ou alteração de `vercel.json`.

## Validação mínima obrigatória

Executar ou declarar resultado esperado se o ambiente não permitir:

```bash
npm run build
docker build -t visitagro .
docker run --rm -p 3000:3000 --env-file .env.local visitagro
```

Critérios:

- `npm run build` sem `DOCKER_BUILD` não deve quebrar.
- `docker build -t visitagro .` deve gerar imagem sem erro.
- `.next/standalone` deve existir no build Docker.
- Container deve iniciar com `node server.js` na porta 3000.

## Formato da resposta do Agente 02

Responder com:

1. Resumo executivo.
2. Reaproveitamento identificado.
3. Arquivos novos.
4. Arquivos alterados com sensibilidade.
5. Detalhe por arquivo com âncora textual e operação.
6. Diff proposto ou conteúdo completo apenas para arquivos novos.
7. Atualização documental.
8. Validação mínima.
9. Riscos de integração.
10. Mensagem de commit sugerida.

## Regra final

Patch mínimo. Sem escopo implícito. Sem tocar em banco, API, auth, middleware ou UI. O build Docker precisa ativar `DOCKER_BUILD=true` para que o `output: 'standalone'` condicional gere `.next/standalone`.
