# L044 — ETAPA_00 — Registro Formal do Lote

## 4.1 Cabeçalho do lote

```text
lote_id          : L044
slug             : portabilidade_multi_cloud
título           : Portabilidade multi-cloud com Docker standalone e configuração centralizada
estado           : aberto
origem           : solicitação humana / débito técnico de infraestrutura
próximo agente   : Agente 02 — Executor de Patch Multi-Cloud
```

---

## 4.2 Contexto

- **Problema observado:** o VisitAgro está documentado e configurado prioritariamente para Vercel, sem artefatos formais para build Docker multi-stage e sem helper central para leitura validada de variáveis de ambiente. Isso reduz a previsibilidade de deploy em AWS, Azure, Google Cloud, VPS ou qualquer plataforma que aceite container.
- **Causa suspeita:** `next.config.mjs` mantém apenas `reactStrictMode: true`; não há configuração `output: 'standalone'` condicionada para build Docker. A raiz do projeto não apresenta `Dockerfile` nem `.dockerignore` na listagem consultada. A pasta `src/lib` contém helpers como `apiFetch.ts`, `auth.ts`, `requestContext.ts`, `supabase.ts` e `supabaseAdmin.ts`, mas não apresenta `config.ts` na listagem consultada.
- **Impacto:** sem o lote, cada migração de provedor tende a exigir ajustes manuais, risco de build quebrado por variáveis ausentes, maior chance de expor arquivos indevidos no contexto Docker e acoplamento operacional à Vercel.
- **Base documental usada:**
  - `AGENTES.md`: confirma stack Next.js 14, React 18, TypeScript, Supabase, JWT próprio, service role e arquivos sensíveis como `.env.example` e `vercel.json`.
  - `docs/playbook-operacional.md`: define lotes pequenos, evidência real, validação com `npm run lint` e `npm run build`, e fluxo ChatGPT → Cursor → Claude → ChatGPT.
  - `docs/index.md`: confirma documentação central, patches, changelog e controle de lotes.
  - `docs/changelog.md`: confirma padrão de atualização documental por lote e histórico recente L036–L038.
  - `docs/ui/responsividade.md`: lido por regra operacional; não se aplica diretamente porque o lote não altera UI, frontend visual ou layout.
  - `docs/padrao_de_comentarios.md`: o repositório atual informa v3.0, embora o prompt cite v2.0. Para a execução futura, usar a versão real do repositório.
  - `next.config.mjs`: arquivo sensível de build/deploy a ser alterado com diff mínimo.
  - `.env.example`: arquivo sensível de configuração a ser alterado com acréscimo localizado.
  - `package.json`: confirma Next.js 14.2.35 e engines Node `>=20.x <21.0.0`.

---

## 4.3 Escopo

### Incluído

#### Sub-lote 044.1 — Dockerfile

- Criar `Dockerfile` na raiz do projeto.
- Criar build multi-stage com três estágios:
  - `deps`: instalação via `npm ci` usando `package.json` e `package-lock.json`.
  - `builder`: cópia do projeto, reaproveitamento de `node_modules`, build do Next.js.
  - `runner`: execução em `node:20-alpine`, usuário não-root, cópia de `public`, `.next/standalone` e `.next/static`.
- Alterar `next.config.mjs` com diff mínimo para permitir `output: 'standalone'` quando `process.env.DOCKER_BUILD` estiver ativo.
- Criar `.dockerignore` na raiz com exclusões mínimas: `node_modules`, `.next`, `.env*.local`, `.git`.
- Registrar ajuste técnico obrigatório para o executor:
  - como `next.config.mjs` será condicional por `DOCKER_BUILD`, o build dentro do Docker precisa definir `DOCKER_BUILD=true` antes de `npm run build`, seja via `ENV DOCKER_BUILD=true` no estágio `builder` ou via `RUN DOCKER_BUILD=true npm run build`.
  - sem esse ajuste, a validação `docker build -t visitagro .` tende a falhar porque `.next/standalone` não será gerado.

#### Sub-lote 044.2 — Configuração Centralizada

- Criar `src/lib/config.ts`.
- Centralizar leitura lazy de variáveis:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `NEXT_PUBLIC_APP_URL`
  - `NODE_ENV`
- Não substituir `src/lib/supabase.ts` nem `src/lib/auth.ts` neste lote.
- Atualizar `.env.example` ao final com:
  - `NEXT_PUBLIC_APP_URL=https://seu-dominio.com`
  - `DOCKER_BUILD=false`
- Atualizar documentação do lote em:
  - `docs/patches/L044_portabilidade_multi_cloud.md`
  - `docs/index.md`
  - `docs/changelog.md`

### Excluído explicitamente

- Migrar o banco Supabase para AWS RDS, Azure SQL, Cloud SQL ou PostgreSQL gerenciado.
- Alterar autenticação, JWT, middleware ou regras de segurança.
- Alterar rotas API, páginas de dashboard, UI, layout ou responsividade.
- Substituir Vercel ou remover `vercel.json`.
- Criar pipeline CI/CD, GitHub Actions, Terraform, Kubernetes, Helm ou Docker Compose.
- Refatorar todos os usos de `process.env` existentes para `config` neste lote.
- Alterar contratos de API, banco de dados, schemas SQL ou migrations.
- Implementar runtime multi-banco ou redundância entre Supabase e outro provedor.

---

## 4.4 Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| `docker build` falhar por ausência de `.next/standalone` | média | alto | Definir `DOCKER_BUILD=true` no estágio `builder` antes de `npm run build`; validar com build Docker real. |
| Alteração em `next.config.mjs` afetar build Vercel/local | média | alto | Manter `output` condicional; quando `DOCKER_BUILD` não estiver ativo, preservar comportamento atual. |
| `.env.example` ficar incoerente com a estratégia Docker | baixa | médio | Acrescentar apenas variáveis novas ao final, sem remover variáveis existentes. |
| `src/lib/config.ts` causar validação eager no build | média | alto | Usar funções lazy, sem leitura/throw no topo do módulo. |
| Arquivo Docker copiar contexto indevido | baixa | médio | Criar `.dockerignore` mínimo e revisável. |
| Conflito com agentes editando `next.config.mjs` ou `.env.example` | média | médio | Usar âncoras textuais e diff mínimo, sem reformatação ampla. |

---

## 4.5 Definition of Ready

O lote só pode entrar em execução se:

- [x] Base documental confirmada
- [x] Escopo revisado e sem ambiguidade
- [x] Arquivos sensíveis identificados
- [x] Migration SQL declarada como não aplicável
- [x] Responsividade verificada como não aplicável por ausência de UI/layout
- [x] Sub-lotes 044.1 e 044.2 delimitados sem execução nesta etapa
- [x] Ajuste `DOCKER_BUILD=true` no build Docker registrado como critério específico
- [x] Padrão real de comentários identificado como `docs/padrao_de_comentarios.md` v3.0

---

## 4.6 Definition of Done

O lote está concluído quando:

- [ ] `Dockerfile` criado na raiz com multi-stage para Next.js 14 e Node 20.
- [ ] `.dockerignore` criado na raiz.
- [ ] `next.config.mjs` alterado com `output` condicional por `DOCKER_BUILD`, sem quebrar build local/Vercel.
- [ ] `src/lib/config.ts` criado com validação lazy.
- [ ] `.env.example` atualizado com `NEXT_PUBLIC_APP_URL` e `DOCKER_BUILD` ao final.
- [ ] `docs/patches/L044_portabilidade_multi_cloud.md` criado.
- [ ] `docs/index.md` atualizado com referência ao L044.
- [ ] `docs/changelog.md` atualizado com entrada L044.
- [ ] `npm run build` executado sem `DOCKER_BUILD` e sem regressão.
- [ ] `docker build -t visitagro .` executado com sucesso.
- [ ] Sem alteração de banco, API, UI, middleware ou autenticação.

---

## 4.7 Validação mínima

### Cenário 1 — Build padrão sem Docker

- **Contexto de entrada:** repositório com `.env.local` válido ou variáveis equivalentes configuradas; `DOCKER_BUILD` ausente ou `false`.
- **Ação:** executar `npm run build`.
- **Resultado esperado:** build Next.js finaliza sem exigir `.next/standalone` e sem alteração perceptível no comportamento atual de deploy Vercel/local.

### Cenário 2 — Build Docker standalone

- **Contexto de entrada:** repositório com `Dockerfile`, `.dockerignore` e `next.config.mjs` ajustado; Docker disponível.
- **Ação:** executar `docker build -t visitagro .`.
- **Resultado esperado:** imagem é construída sem erro; etapa `runner` consegue copiar `/app/.next/standalone` e `/app/.next/static`.

### Cenário 3 — Execução do container

- **Contexto de entrada:** imagem `visitagro` construída.
- **Ação:** executar `docker run --rm -p 3000:3000 --env-file .env.local visitagro`.
- **Resultado esperado:** aplicação sobe em `http://localhost:3000` usando `node server.js` e porta `3000`.

### Cenário 4 — Configuração lazy não quebra build sem `.env`

- **Contexto de entrada:** ambiente sem `.env.local` durante build, desde que nenhuma rota/helper invoque as funções de `config` em tempo de build.
- **Ação:** executar `npm run build`.
- **Resultado esperado:** import de `src/lib/config.ts` não dispara erro sozinho; erro só ocorre quando uma função específica de configuração obrigatória for chamada em runtime.

### Cenário 5 — Erro explícito para variável obrigatória ausente

- **Contexto de entrada:** runtime sem `JWT_SECRET` ou sem `SUPABASE_SERVICE_ROLE_KEY`, e fluxo que chame a função correspondente.
- **Ação:** chamar `config.jwt.secret()` ou `config.supabase.serviceRoleKey()`.
- **Resultado esperado:** erro explícito e legível informando a variável ausente.

### Cenário 6 — Documentação de ambiente

- **Contexto de entrada:** abrir `.env.example` após a alteração.
- **Ação:** verificar o final do arquivo.
- **Resultado esperado:** existem `NEXT_PUBLIC_APP_URL=https://seu-dominio.com` e `DOCKER_BUILD=false`, sem remoção das variáveis já existentes.

---

## 4.8 Arquivos envolvidos

### Prováveis

```text
Dockerfile
.dockerignore
next.config.mjs
src/lib/config.ts
.env.example
docs/patches/L044_portabilidade_multi_cloud.md
docs/index.md
docs/changelog.md
```

### Alta sensibilidade

```text
next.config.mjs
.env.example
```

---

## 4.9 Dependências

- **Migration SQL exigida:** não
- **Atualização documental exigida:** sim — `docs/patches/L044_portabilidade_multi_cloud.md`, `docs/index.md`, `docs/changelog.md`
- **Documentação prévia pendente:** não bloqueante
  - Observação: o prompt menciona `docs/padrao_de_comentarios.md` v2.0, mas o repositório consultado mostra v3.0. Usar v3.0 como fonte real na implementação futura.

---

## 4.10 Critérios de reprovação da abertura

Esta abertura é inválida se qualquer item abaixo for verdadeiro:

- [ ] Escopo amplo ou dependente de interpretação livre
- [ ] Base documental não explicitada
- [ ] Lote aberto sobre ideia não formalizada
- [ ] "Fora de escopo" ausente ou vago
- [ ] Validação mínima genérica demais
- [ ] Arquivos sensíveis não destacados quando relevantes
- [ ] Lote mistura mais de um problema estrutural grande
- [ ] Frontend sem verificação de `docs/ui/responsividade.md`
- [ ] Conflito documental encontrado e não registrado

### Status da abertura

- **Resultado:** abertura válida.
- **Observação técnica crítica:** a versão de Dockerfile fornecida na solicitação humana precisa explicitar `DOCKER_BUILD=true` no build Docker, pois o `next.config.mjs` proposto só gera `standalone` quando essa variável está ativa.

---

## 5. Arquivos gerados nesta abertura

```text
/L044_portabilidade_multi_cloud/
├── docs/lote/
│   └── L044_portabilidade_multi_cloud_ETAPA_00_REGISTRO_LOTE.md
├── metadata/
│   └── lote.json
├── checklist/
│   └── validacao.md
└── prompt/
    └── prompt.md
```
