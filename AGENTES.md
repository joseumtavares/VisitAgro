# AGENTES.md — Regras operacionais (VisitAgro)

Documento para **desenvolvedores humanos** e **agentes de IA** (Claude, Cursor, etc.) que trabalham no repositório **VisitAgro**. O objetivo é manter alterações **seguras para integração** (merge manual ou via Git), evitando conflitos, duplicação de lógica, quebra de arquivos sensíveis e retrabalho.

---

## 0. Contexto do projeto (obrigatório ler antes de codar)

| Item | Valor no repositório atual |
|------|---------------------------|
| App | Next.js **14** (App Router), React 18, TypeScript |
| API | Rotas em `src/app/api/**/route.ts` |
| Auth | JWT próprio + `bcryptjs`; **`middleware.ts` na raiz** protege `/api/*` (exceto rotas públicas documentadas) |
| Banco | Supabase (Postgres); cliente admin em `src/lib/supabaseAdmin.ts` (**service role** — **RLS não se aplica** ao `getAdmin()`) |
| Tenancy | Header **`x-workspace`** (default `principal`); contexto tipado em `src/lib/requestContext.ts` (`getRequestContext`) |
| Soft delete | Onde existir `deleted_at`, respeitar **`.is('deleted_at', null)`** em leituras e **não apagar fisicamente** sem alinhamento |
| Cliente HTTP autenticado | `src/lib/apiFetch.ts` |
| Tipos compartilhados | `src/types/index.ts` (não há pasta `src/lib/validators` dedicada — validações costumam estar na própria rota ou em `src/lib/`) |
| Schema SQL de referência | `sql/` (ex.: `schema_atual_v094_supabase.sql`), além de scripts em `scripts/` |
| Estado global (auth/UI) | `src/store/authStore.ts` |
| Documentação de produto | `README.md`, `docs/` |

**Regra de ouro:** antes de propor código, **abra e leia** os arquivos reais do repositório (estrutura muda). Não assuma caminhos só pela memória do modelo.

---

## 1. Objetivo da entrega

Toda implementação deve ser:

- **Modular** — permite testar e integrar por partes.
- **Incremental** — melhorias pequenas e reversíveis.
- **Reaproveitando o existente** — estender padrões já usados nas rotas e na UI do dashboard.
- **Mínima em arquivos compartilhados** — tocar só no necessário.
- **Localizável** — quem integra deve saber **onde** aplicar (âncoras de texto, não só “linha 42”).
- **Pronta para merge** — sem reformatação cosmética em arquivos que outros editam em paralelo.

---

## 2. Antes de escrever código

1. **Mapear o repositório** — árvore sob `src/app`, `src/lib`, `src/components`, `src/store`, `sql/`.
2. **Buscar implementação similar** — mesma entidade (clientes, pedidos, produtos, etc.) ou mesmo padrão (GET com filtros, POST com insert, audit).
3. **Definir contrato** — o que a UI em `src/app/dashboard/**` já espera (JSON, nomes de campos, status HTTP).
4. **Identificar sensibilidade** — ver secção 4.
5. **Planejar validação** — `npm run lint` e, quando aplicável, fluxo manual mínimo descrito na entrega.

---

## 3. Onde procurar antes de criar algo novo

| Necessidade | Onde olhar primeiro |
|-------------|---------------------|
| Lógica server / Supabase admin | `src/lib/supabaseAdmin.ts`, `src/lib/auth.ts`, `src/lib/commissionHelper.ts` |
| Chamadas HTTP da UI | `src/lib/apiFetch.ts` |
| Rotas REST | `src/app/api/**` (espelhar estilo das rotas irmãs) |
| Componentes e layout | `src/components/**`, `DashboardShell` |
| Tipos | `src/types/index.ts` |
| Workspace e utilizador na API | `getRequestContext` / headers `x-workspace`, `x-user-id`, `x-user-name`, `x-user-role` |
| Auditoria | `auditLog(...)` em `src/lib/supabaseAdmin.ts` — usar em mutações relevantes, como nas rotas existentes |

Se reutilizar um padrão:

- **Estenda com o menor diff possível.**
- **Descreva na entrega** o que foi reutilizado e porquê.

---

## 4. Arquivos e áreas de alta sensibilidade

Alterar apenas com **justificativa explícita** e **diff mínimo**:

| Área | Motivo |
|------|--------|
| `middleware.ts` (raiz) | Afeta toda a API e segurança JWT |
| `src/lib/supabaseAdmin.ts` | Service role + `auditLog`; impacto global |
| `src/lib/auth.ts` | Senhas, JWT, verificação de credenciais |
| `src/lib/apiFetch.ts` | Todas as chamadas autenticadas da UI |
| `src/types/index.ts` | Contratos usados em vários módulos |
| `src/store/authStore.ts` | Sessão, workspace, persistência |
| `src/app/layout.tsx`, shell de dashboard | Layout global |
| `vercel.json`, `.env.example` | Deploy e configuração |

Para estes ficheiros: **sem reorder massivo de imports**, **sem prettier “só porque sim”**, **sem mover blocos** sem necessidade funcional.

---

## 5. Banco de dados e Supabase

- O cliente **`getAdmin()` ignora RLS** — filtros de **`workspace`**, **`deleted_at`** e autorização devem ser **explícitos na camada da rota** (como já documentado em `supabaseAdmin.ts`).
- Antes de mudar dados: confirmar **nome da tabela**, **tipos**, **nullability**, **defaults**, **FKs**, **índices**, **triggers**, consumo nas rotas e páginas.
- Alterações de schema: refletir em **`sql/`** (e/ou scripts já usados pelo projeto) de forma **incremental**; não reescrever ficheiros SQL inteiros se um bloco localizado chega.
- **Não misturar** no mesmo PR/commit: refatoração grande de schema **com** feature nova (a menos que seja inevitável e documentado).

---

## 6. Rotas API (`src/app/api/**`)

1. Alinhar com **`middleware.ts`**: rotas públicas vs JWT obrigatório.
2. Preferir **`getRequestContext(request)`** quando precisar de `userId` / `workspace` de forma consistente.
3. Manter **formato de resposta** e códigos HTTP compatíveis com o que `apiFetch` e as páginas já tratam.
4. **Tenancy:** `.eq('workspace', workspace)` quando a tabela for por workspace.
5. **Soft delete:** `.is('deleted_at', null)` em listagens/leituras quando aplicável; updates de “remoção” devem seguir o padrão existente (ex.: `deleted_at` / `active`).
6. **Auditoria:** `await auditLog('...', { ... }, userId)` em operações que alteram dados sensíveis ou negócio, seguindo o estilo das rotas atuais.
7. **Evitar breaking changes** silenciosas em JSON (renomear campos só com migração da UI e da API coordenadas).

---

## 7. Frontend (`src/app/dashboard/**`, componentes)

1. Identificar **qual rota** alimenta a página e o **formato real** da resposta.
2. **Tipos:** alinhar com `src/types/index.ts` ou tipos locais já usados na mesma feature.
3. **Não duplicar** transformações que já existem noutro sítio para a mesma entidade.
4. Respeitar **layout, fluxo e naming** do dashboard existente.
5. Preferir **correção localizada** a refatoração ampla não pedida.

Se a UI depender de rota inexistente ou contrato desatualizado, tratar como **bloqueador** e corrigir API ou UI de forma coordenada.

---

## 8. Documentação

Atualizar **apenas quando a mudança for significativa** para quem opera o projeto:

- `README.md` (env, rotas, status de módulos)
- `docs/` e notas de versão, se existirem para o tema
- `.env.example` se novas variáveis forem obrigatórias

Evitar documentação genérica duplicada; preferir **uma fonte** clara (README ou doc técnica).

---

## 9. Trabalho em paralelo (vários agentes ou branches)

- Assumir que **o mesmo ficheiro** pode estar a ser editado noutro sítio.
- Preferir **blocos pequenos** inseridos com **âncora textual única** (3–5 linhas de contexto antes do ponto de edição).
- **Nunca depender só do número de linha** — números mudam; âncoras mudam menos.
- Evitar alterações cosméticas (espaços, aspas, ordem de chaves) em ficheiros partilhados.

---

## 10. Formato de entrega

### 10.1 Entrega padrão (Git / PR / merge no repositório)

Quando o fluxo é **commit ou pull request** no mesmo repo:

1. **Resumo executivo** (2–5 frases).
2. **Reaproveitamento** — ficheiros/padrões usados como referência.
3. **Ficheiros novos** — caminho completo + propósito.
4. **Ficheiros alterados** — tabela ou lista com **sensibilidade** (baixa / média / alta).
5. **Por ficheiro alterado** (obrigatório para ficheiros de sensibilidade média ou alta):
   - **Ação:** criar | alterar | inserir bloco | substituir trecho | remover trecho
   - **Caminho completo**
   - **Motivo**
   - **Âncora:** trecho existente **exato** (citação) **antes** da alteração — ponto de inserção ou trecho a substituir
   - **Diff conceitual** ou código final do bloco
   - **O que o bloco faz** (uma frase)
   - **Risco de integração** e **como validar** (ex.: `npm run lint`, passos na UI)

### 10.2 Entrega por pacote ZIP (integração manual fora do Git)

Usar **só quando** a entrega for literalmente por cópia ficheiro a ficheiro (ex.: ambiente sem acesso ao repo).

**Nome sugerido:** `nome-da-funcionalidade.zip`

**Conteúdo mínimo:**

```text
nome-da-funcionalidade.zip
├── novos-arquivos/          ← ficheiros novos com caminho espelhado ou README explicando destino
├── patches/                 ← diffs ou instruções por ficheiro
├── docs/                    ← apenas se houver doc nova ou alterada
└── GUIA_APLICACAO.md        ← ordem de aplicação, dependências, pontos de atenção no merge
```

O `GUIA_APLICACAO.md` deve incluir: pré-requisitos, ordem sugerida de aplicação, ficheiros de **alta sensibilidade**, comandos de validação, e **checklist** pós-merge.

### 10.3 Resposta final sugerida (ordem)

Para agentes, preferir esta ordem na mensagem final:

1. Resumo executivo  
2. Reaproveitamento identificado  
3. Ficheiros novos  
4. Ficheiros alterados (com sensibilidade)  
5. Detalhe por ficheiro (âncora + código)  
6. Alterações de base de dados / SQL, se houver  
7. Documentação atualizada, se houver  
8. Estrutura do pacote (se ZIP for usado) + resumo do `GUIA_APLICACAO.md`  
9. Validação mínima  
10. Riscos de integração  

*(Itens 8 pode omitir-se quando a entrega for apenas PR/commit.)*

---

## 11. Regra final

A melhor entrega **resolve o problema real**, **segue padrões do VisitAgro**, **reduz regressões**, **facilita merge**, deixa explícito o impacto em **API, UI e base de dados**, e **não cria trabalho extra** para quem integra.

Quem integra deve conseguir responder **“o que mudou, onde, e como testar”** sem perguntar de novo ao autor.
