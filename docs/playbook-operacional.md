# Playbook operacional — VisitAgro

**Versão do documento:** 1.0  
**Alinhamento de produto:** VisitAgro / `visitagropro` **v0.9.4** (ver `package.json` e `README.md`)

Este playbook define **como** executar desenvolvimento por **lotes pequenos**, com **ChatGPT** como orquestrador/revisor, **Cursor** como rastreador de impacto (com acesso ao repositório real) e **Claude** como autor de **patch mínimo seguro**. Complementa as regras de entrega em [`AGENTES.md`](../AGENTES.md) (âncoras, sensibilidade de ficheiros, formato de merge).

---

## 1. Fonte de verdade e documentos do repo

| Documento / pasta | Uso |
|-------------------|-----|
| [`AGENTES.md`](../AGENTES.md) | Regras de código, paths reais, service role, headers, entrega por ficheiro |
| [`README.md`](../README.md) | Stack, estrutura, rotas principais, status de módulos *(pode ficar desatualizado — validar no código)* |
| [`docs/index.md`](index.md) | Índice da documentação |
| [`docs/changelog.md`](changelog.md) | Histórico de alterações |
| [`docs/updates-v094.md`](updates-v094.md) | Notas da release 0.9.4 |
| [`docs/setup-banco.md`](setup-banco.md) | Setup de base de dados |
| [`sql/`](../sql/) | Schema de referência (ex.: `schema_atual_v094_supabase.sql`) |
| Raiz: [`middleware.ts`](../middleware.ts) | Proteção JWT de `/api/*` |

**Regra:** Não usar `public/index.html` nem materiais do AgroVisita v4 como arquitetura atual — apenas inspiração de **roadmap de produto**.

**Registo de fecho de lote:** Preferir atualizar [`docs/changelog.md`](changelog.md) e, se fizer sentido, uma secção curta em [`docs/updates-v094.md`](updates-v094.md) ou um ficheiro `docs/updates-lote-XX.md`. O nome `UPDATES.md` na raiz **não existe** neste repositório; usar `docs/` como acima.

---

## 2. Stack e infraestrutura (estado atual)

| Item | Valor típico no projeto |
|------|---------------------------|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| API | `src/app/api/**/route.ts` |
| Auth | JWT (`src/lib/auth.ts`) + `middleware.ts` na raiz |
| Dados | Supabase; `getAdmin()` em `src/lib/supabaseAdmin.ts` usa **service role** — **RLS não aplica**; filtros de `workspace` e `deleted_at` são **na aplicação** |
| Tenancy | Header `x-workspace` (default `principal`); `getRequestContext` em `src/lib/requestContext.ts` |
| Cliente HTTP UI | `src/lib/apiFetch.ts` |
| Deploy | Vercel (região referida no README: `gru1`) |
| Node | `>=20.x <21` (`package.json` engines) |
| Validação local | `npm run lint`, `npm run build` |

---

## 3. Princípios

1. **Lotes pequenos** — um objetivo, um critério de pronto, risco explícito.
2. **Evidência real** — caminhos de ficheiro, excertos, grep/leitura; não inventar tabelas, rotas ou páginas.
3. **Patch mínimo** — sem refatoração cosmética em ficheiros partilhados.
4. **Ordem de risco** — build/deploy → schema/SQL → auth → API ↔ UI → funcionalidades → roadmap.
5. **Fecho com validação** — lint, build, fluxo manual mínimo; para alterações de dados, verificar Supabase com o mesmo cenário.
6. **Trava de escopo** — nenhum agente alarga o lote sem nova rodada de **abertura** (orquestrador).

---

## 4. Papéis dos agentes

| Agente | Papel | Ferramentas / força |
|--------|--------|---------------------|
| **ChatGPT** | Orquestrador: define lote, refinamento, revisão crítica das saídas, consolida patch, checklist, commit, registo em `docs/`, próximo lote | Bom para síntese e cortar escopo |
| **Cursor** | Rastreio: árvore do repo, `grep`, leitura de ficheiros, mapa banco → API → UI, ausências **com prova** | Acesso direto ao código |
| **Claude** | Implementação/diagnóstico: causa raiz, diff mínimo, riscos, validação, SQL quando necessário | Bom para patches cirúrgicos e explicação técnica |

**Fluxo por lote (obrigatório):**

1. ChatGPT — **Abertura do lote** (objetivo, escopo, fora de escopo, risco, DoD, validação mínima).  
2. Cursor — **Mapa de impacto** (Update B).  
3. Claude — **Patch proposto** (Update C).  
4. ChatGPT — **Consolidação** (Update D): patch final recomendado, riscos, checklist, mensagem de commit, texto para changelog.  
5. Humano/repo — **Aplicar, testar, merge**.  
6. ChatGPT (+ opcional Cursor/Claude) — **Fecho** (Update E / Fase 6).

Para lotes pequenos, usar os **prompts curtos** (secção 12). Para Fase 0 e Fase 1, preferir **prompts completos**.

---

## 5. Modelo oficial de lote (template)

Copiar e preencher no início de cada lote:

```text
Nome do lote:
Branch sugerida: feature/lote-XX-nome-curto

Objetivo:
Escopo (entra):
Fora de escopo (não tocar):
Risco: baixo | médio | alto  (justificativa)
Critério de pronto (DoD):
Validação mínima:
  - npm run lint
  - npm run build
  - fluxo manual: [...]
  - Supabase / dados: [...] (se aplicável)

Evidências de fecho para o repositório:
  - diff ou lista de commits
  - captura de ecrã ou nota de teste (se UI)
  - resposta HTTP exemplo (se API)
  - entrada em docs/changelog.md (e updates se necessário)
```

---

## 6. Updates por etapa (A–E)

| Update | Autor | Conteúdo |
|--------|-------|----------|
| **A — Definição do lote** | ChatGPT | Objetivo, escopo, fora de escopo, risco, DoD, validação, limites para Cursor/Claude |
| **B — Mapa de impacto** | Cursor | Ficheiros diretos/indiretos, SQL/schema, rotas, páginas, tipos, payloads, riscos priorizados *(com caminhos)* |
| **C — Patch mínimo seguro** | Claude | Causa raiz, ficheiros, diff/antes-depois, SQL/migration se houver, riscos, como validar |
| **D — Consolidação** | ChatGPT | Patch final, o que remover do excesso, checklist de regressão, commit, changelog |
| **E — Pós-merge** | ChatGPT | Estado do lote, risco residual, rollback simples, próximo lote recomendado |

---

## 7. Definition of Ready (DoR) e Definition of Done (DoD)

**DoR — o lote só começa com:**

- Objetivo e **escopo** explícitos (e “fora de escopo”).
- Risco e **DoD** acordados.
- Validação mínima definida (incluindo build).
- Dependências críticas identificadas (ex.: migration antes da UI).

**DoD — o lote só fecha com:**

- Patch aplicado (ou pronto a aplicar) alinhado com `AGENTES.md`.
- `npm run lint` e `npm run build` OK *(salvo exceção documentada)*.
- Contrato API/UI principal preservado ou breaking change **explícita** e coberta.
- Fluxo manual descrito executado.
- Risco residual documentado.
- `docs/changelog.md` (e notas em `docs/` se aplicável) atualizados.
- Próximo lote ou “pendência” registada.

---

## 8. Guardrails

- Não ampliar escopo a meio do lote.
- Não misturar **migration grande** com **várias features** no mesmo PR sem necessidade.
- Não criar UI sem lastro em API/schema *(ou documentar o stub)*.
- Não confiar só em números de linha — usar **âncoras** (ver `AGENTES.md`).
- Separar sempre: erro confirmado | bug potencial | débito técnico | melhoria opcional | ausência funcional **com evidência**.

---

## 9. Fases oficiais e ordem recomendada de roadmap

Esta ordem está alinhada ao método incremental; **ajustar números de lote** ao histórico real do Git.

| Fase | Nome | Foco |
|------|------|------|
| **0** | Baseline e travas | Estado do repo, branches, DoR/DoD, fila de lotes — *sem código se não for necessário* |
| **1** | Hardening núcleo | Schema/contratos/`workspace`/integridade — ex.: pedidos (`orders`, `order_items`), locking otimista se estiver no schema |
| **2** | Módulos com suporte em BD | Ex.: `rep_commissions`, gestão de workspaces — sempre verificar `sql/` e rotas existentes |
| **3** | Cobertura funcional mínima | CRUD/listagens que faltam — **confirmar no repo** (ex.: pré-cadastros já têm pasta em `src/app/dashboard/pre-registrations/`; o README pode listar como pendente) |
| **4** | Débitos técnicos | Erros silenciosos, `supabase.ts`, refresh tokens, `geocode_cache`, etc. — só com evidência em código |
| **5** | Roadmap produto | Offline, PDF, agenda, etc. — fatiar em lotes pequenos |
| **6** | Fechamento | Verificação final, cobertura do diff vs mapa, registo histórico |

---

## 10. Cadência e quando dividir um lote

- **Uma** passagem B → C → D por iteração; reabrir se build falhar ou contrato não fechar.
- Dividir o lote se: >~10 ficheiros sensíveis, mistura schema+auth+várias UIs, ou revisão humana deixar de ser clara.

---

## 11. Prompts por fase — ChatGPT (orquestrador)

### 11.0 Fase 0 — Baseline

```text
Atua como orquestrador técnico do repositório VisitAgro (Next.js 14 App Router, Supabase, JWT, middleware na raiz).

Fonte de verdade: ficheiros reais do projeto. Documentação em README.md, docs/, AGENTES.md. Não uses public/index.html como arquitetura atual.

Objetivo (Fase 0): consolidar estado atual, separar estável vs pendente, propor ordem de lotes, travas de execução (DoR/DoD, branch naming, registo em docs/changelog.md).

Tarefa:
1. Indicar o que precisa de leitura no repo (não inventes rotas/tabelas).
2. Separar: estável | parcial | pendente | risco imediato.
3. Propor ordem de lotes alinhada a AGENTES.md.
4. Definir modelo de updates A–E e critério de pronto por lote.

Formato de saída:
1. Diagnóstico do estado (genérico até haver input do Cursor)
2. O que está estável / pendente / arriscado (marcar "a confirmar no repo" onde aplicável)
3. Ordem recomendada dos lotes
4. Modelo de updates e regras para Cursor vs Claude
5. Próximo passo concreto (ex.: "executar prompt Cursor Fase 0")
```

### 11.1 Fase 1 — Hardening (substituir [LOTE])

```text
Atua como orquestrador técnico do VisitAgro na Fase 1: hardening de banco/contratos/integridade.

Contexto obrigatório: src/app/api/**/route.ts, src/lib/supabaseAdmin.ts (service role — filtros na app), src/lib/requestContext.ts, sql/ para schema. Seguir AGENTES.md para entrega.

Lote desta rodada:
[COLE O LOTE — objetivo, escopo, fora de escopo]

Vou enviar:
1. Saída do Cursor (mapa de impacto)
2. Saída do Claude (patch)
3. Diff aplicado (se existir)

Tarefa:
- Rever criticamente B e C; eliminar exageros; consolidar o menor patch seguro.
- Ordem de aplicação; riscos de regressão; checklist de validação (lint, build, API, Supabase).
- Mensagem de commit; texto para docs/changelog.md; próximo lote.

Formato:
1. Diagnóstico consolidado
2. Patch recomendado (ou "manter apenas X do Claude")
3. Riscos remanescentes
4. Checklist de validação
5. Commit sugerido
6. Entrada sugerida para docs/changelog.md
7. Próximo lote recomendado

Restrições: não ampliar escopo; não aceitar patch sem evidência e sem validação; não assumir RLS no service role.
```

### 11.2 Fases 2 a 5 — Variante (módulos / cobertura / débitos / roadmap)

Substituir apenas o **primeiro parágrafo de objetivo**:

- **Fase 2:** "ativação de módulos com lastro em schema e API; sem telas órfãs".
- **Fase 3:** "cobertura mínima; confirmar o que já existe em src/app/dashboard antes de assumir ausência".
- **Fase 4:** "débitos técnicos e observabilidade; sem mudar comportamento de negócio sem declarar".
- **Fase 5:** "roadmap de produto em recortes mínimos; pré-requisitos explícitos".

O restante do template da Fase 1 mantém-se (entradas Cursor + Claude + diff, saída consolidada, changelog).

### 11.3 Fase 6 — Fechamento

```text
Atua como orquestrador na Fase 6: fechamento do lote VisitAgro.

Entradas: objetivo do lote; mapa Cursor; proposta Claude; diff final; resultados de lint/build/testes manuais.

Tarefa: confirmar escopo; listar o que entrou e o que ficou de fora; riscos residuais; checklist final; commit; docs/changelog.md; próximo lote.

Formato:
1. Diagnóstico final
2. Alterações confirmadas
3. Excluído do lote (explícito)
4. Riscos remanescentes
5. Checklist final
6. Commit sugerido
7. Texto para docs/changelog.md
8. Próximo lote
```

### 11.4 Prompt curto — ChatGPT (qualquer fase)

```text
Orquestrador VisitAgro — lote [NOME]. Fase: [0–6].

Objetivo: […]

Entradas: (1) Cursor mapa (2) Claude patch (3) diff aplicado.

Tarefa: consolidar diagnóstico; cortar exageros; patch mais seguro; riscos; checklist (lint, build, fluxo); commit; changelog em docs/; lote fecha ou segunda rodada?

Saída: Diagnóstico | Patch recomendado | Riscos | Checklist | Commit | Changelog | Próximo lote
```

---

## 12. Prompts por fase — Cursor (rastreio no repositório)

### 12.0 Fase 0 — Baseline

```text
Atua como auditor de rastreio no repositório VisitAgro (usa ferramentas: listar diretórios, ler ficheiros, grep).

Regras: só afirmações com evidência (caminho + excerto ou listagem). Não inventes stack, tabelas ou rotas.

Tarefa:
1. Stack e versões: ler package.json, vercel.json, middleware.ts, tsconfig.json.
2. Mapear src/app/api/**, src/app/dashboard/**, src/lib/**, src/types/**.
3. Listar rotas API que usam getAdmin/supabaseAdmin.
4. Entidades SQL: referências cruzadas com sql/*.sql (nomes de tabelas usados no código).
5. README vs código: apontar divergências com evidência.
6. Riscos priorizados e ordem sugerida de lotes (técnica, não de produto especulativo).

Formato obrigatório:
1. Resumo executivo
2. Evidências (lista de ficheiros lidos)
3. Estrutura real resumida
4. Rotas API e dependência de dados
5. Páginas dashboard e ligação a API
6. Entidades BD mais referenciadas no código
7. Módulos prontos / parciais / ausências com evidência
8. Riscos e ordem de lotes
```

### 12.1 Fase 1 — Hardening

```text
Auditor de rastreio — VisitAgro — Fase 1. Lote: [COLAR LOTE].

Objetivo: mapa completo de impacto para hardening (schema, API, UI, tipos).

Regras: evidência real; citar ficheiros; notar service role e filtros workspace/deleted_at em supabaseAdmin.

Tarefa: ficheiros diretos/indiretos; tabelas/views/triggers mencionadas em sql/ e código; rotas; páginas; tipos em src/types/index.ts; contratos JSON; riscos por severidade.

Formato: Resumo | Evidências | BD afetada | Ficheiros | APIs | UI | Tipos/contratos | Riscos | Pontos de atenção
```

### 12.2 Fases 2–5

Reutilizar 12.1 trocando o primeiro parágrafo para o foco da fase (módulo BD, lacunas UI, débito técnico, roadmap com ficheiros tocados).

### 12.3 Fase 6 — Verificação final

```text
Verificação final de lote — VisitAgro.

Entradas: objetivo do lote; mapa de impacto anterior; diff final aplicado.

Tarefa: comparar impacto previsto vs diff real; lacunas; ficheiros que deviam ser tocados; risco de contrato; classificar: fechado seguro | fechado com ressalvas | segunda rodada.

Formato: Resumo | Cobertura do diff | Lacunas | Riscos residuais | Classificação | Notas para o próximo lote
```

### 12.4 Prompt curto — Cursor

```text
Rastreio VisitAgro. Fase [N]. Lote: […].

Mapear sem inventar: ficheiros diretos/indiretos; banco→API→frontend; tipos/payloads; ausências com prova; riscos.

Formato: Resumo | Evidências | Afetados | Contratos | Riscos | Atenção seguinte
```

---

## 13. Prompts por fase — Claude (patch mínimo)

### 13.0 Fase 0

```text
Engenheiro sénior — VisitAgro — Fase 0 (baseline).

Não escrevas código a menos que o orquestrador peça. Produz leitura técnica: estabilidade, gargalos, divisão em lotes seguros, critérios de validação por tipo de mudança.

Regras: evidência; não inventar; respeitar AGENTES.md e arquitetura atual.

Formato: Resumo | Estado consolidado | Áreas estáveis | Gargalos | Riscos por área | Estratégia de lotes | Validação mínima | Próximo lote prioritário
```

### 13.1 Fase 1 — Hardening

```text
Engenheiro sénior — VisitAgro — Fase 1. Patch mínimo seguro.

Lote: [COLAR]
Mapa de impacto (Cursor): [COLAR]

Regras:
- Evidência no código; não expandir escopo.
- Preservar padrão das rotas e getRequestContext/headers.
- Service role: manter filtros workspace e soft-delete onde aplicável.
- Incluir auditLog em mutações relevantes se o padrão existir nas rotas irmãs.

Tarefa: causa raiz; correção mínima; ficheiros; diff ou antes/depois; SQL/migration se necessário; riscos; validação local/build/BD/fluxo.

Formato: Resumo | Evidências | Causa raiz | Ficheiros | Correção | Diff | SQL | Riscos | Validação | Próximo crítico
```

### 13.2 Fases 2–5

Igual a 13.1 com o objetivo da fase no primeiro parágrafo (ativação de módulo, UI mínima, débito técnico, feature roadmap).

### 13.3 Fase 6 — Revisão técnica final

```text
Revisão técnica final — lote VisitAgro.

Entradas: objetivo; mapa Cursor; patch final; validações.

Tarefa: causa raiz tratada? riscos remanescentes? ajustes obrigatórios antes do merge? lote concluído?

Formato: Resumo | Revisão | Riscos | Ajustes obrigatórios | Validação final | Próximo lote/erro
```

### 13.4 Prompt curto — Claude

```text
Claude — VisitAgro. Fase [N]. Lote: […]. Mapa Cursor: […].

Patch mínimo, incremental, alinhado a AGENTES.md. Causa raiz | ficheiros | diff | riscos | validação (lint, build, API, BD) | próximo crítico.
```

---

## 14. Auditoria técnica atualizada — prompts

Usar **antes** de uma onda grande de lotes ou após releases relevantes. Saída deve poder ir para [`docs/auditoria-tecnica.md`](auditoria-tecnica.md) ou novo ficheiro datado em `docs/`.

### 14.1 Prompt mestre (auditoria completa)

```text
Atua como auditor técnico sénior, com foco em Next.js 14, Vercel, Supabase/Postgres, JWT, TypeScript, React, Tailwind, Zustand.

Missão: AUDITORIA TÉCNICA ATUALIZADA do VisitAgro com base no repositório real (ficheiros, configs, sql/, src/, middleware na raiz).

NÃO inventes: stack, tabelas, colunas, rotas, páginas, vulnerabilidades, regras de negócio. Se não houver evidência, declara "evidência insuficiente" ou "não confirmado".

Fonte de verdade prioritária: repositório atual. Documentos antigos ou AgroVisita v4: apenas histórico/roadmap de produto, não arquitetura.

Inclui na análise: package.json, engines, vercel.json, middleware.ts, src/app/**, src/app/api/**, src/lib/** (incl. supabaseAdmin, auth, apiFetch), src/components/**, src/store/**, src/types/**, sql/*.sql, docs/, README, .env.example se existir.

Nota VisitAgro: getAdmin() usa service role — comenta implicações para RLS e necessidade de filtros na aplicação.

Prioridade: build/deploy → runtime → schema/integridade → auth → contratos API↔UI → débitos → melhorias.

FORMATO DE SAÍDA (Markdown):

# Auditoria Técnica — VisitAgro (v0.9.4 ou indicar versão lida em package.json)
> Data: [usar data do contexto do utilizador se fornecida]
> Base: código-fonte do repositório

## 1. Stack identificada
(tabela: camada | tecnologia | versão | notas)

## 2. Evidências usadas
(lista de ficheiros/caminhos)

## 3. Estrutura do sistema
(árvore resumida, responsabilidades)

## 4. Problemas encontrados
Por severidade (crítico / alto / médio / baixo). Por item: título; ficheiros; evidência; descrição; causa raiz; impacto; correção mínima; risco da correção.

## 5. Melhorias recomendadas
(tabela: ID | melhoria | impacto | esforço | prioridade)

## 6. Refatorações sugeridas
(incrementais apenas)

## 7. Mini-documentação de módulos centrais
(middleware, auth, apiFetch, supabaseAdmin, authStore, rotas críticas — responsabilidade, dependências, limitações)

## 8. Changelog técnico observável
(ou declarar falta de histórico git na análise)

## 9. Testes recomendados
(compatíveis com a stack; sem inventar framework se não existir)

## 10. Próximos passos
(imediato / curto / médio)

## A. Matriz de módulos
## B. Matriz de dívida técnica
## C. Plano de execução por fases/lotes
## D. Padrão de mensagens de commit

## Limitações da auditoria
(o que não foi possível verificar)

Gera a auditoria completa agora, rigorosamente nesta estrutura.
```

### 14.2 Versão curta (auditoria)

```text
Auditoria técnica VisitAgro em Markdown, só com evidência do repositório.

Cobre: stack, estrutura, problemas por severidade com ficheiros, melhorias, refatorações incrementais, mini-docs de módulos centrais (middleware, auth, apiFetch, supabaseAdmin), matrizes de módulos e dívida, plano por lotes, testes sugeridos, limitações.

Fontes: package.json, vercel.json, middleware.ts, src/app, src/app/api, src/lib, src/components, src/store, src/types, sql/, docs/, README, .env.example.

Diferencia: erro confirmado | bug potencial | débito | melhoria | ausência funcional com prova.

Formato: secções 1–10, A–C, Limitações (como no prompt mestre, sem repetir todo o texto das instruções).
```

### 14.3 Variante ChatGPT (auditoria → consolidar e priorizar)

```text
Atua como orquestrador após uma auditoria bruta do VisitAgro.

Entrada: rascunho de auditoria (de Cursor/Claude/outro) ou notas fragmentadas.

Tarefa:
1. Verificar consistência e remover duplicados.
2. Priorizar achados por severidade e dependência (build primeiro).
3. Converter em plano de lotes alinhado a docs/playbook-operacional.md e AGENTES.md.
4. Marcar itens "não confirmados" que precisam de verificação no repo.
5. Produzir resumo executivo de 1 página e lista priorizada de próximos 3 lotes.

Não inventes achados novos sem marcar como hipótese.
```

### 14.4 Variante Cursor (auditoria baseada em ferramentas)

```text
Executa auditoria técnica do VisitAgro usando o repositório real.

Instruções:
1. Ler package.json, vercel.json, middleware.ts, next.config.* se existir.
2. Listar src/app/api e resumir métodos HTTP por rota (grep route.ts).
3. Grep por getAdmin(, supabaseAdmin, auditLog, x-workspace, deleted_at.
4. Comparar entidades referenciadas no código com sql/schema_atual_v094_supabase.sql (ou ficheiro mais recente em sql/).
5. Identificar divergências README vs código (rotas/páginas).
6. Produzir relatório Markdown nas secções do prompt mestre (14.1), preenchendo apenas o que tiveres evidência; nas lacunas escrever "não verificado".

Saída: Markdown completo com lista de ficheiros analisados.
```

### 14.5 Variante Claude (auditoria profunda de código)

```text
Auditoria técnica profunda do VisitAgro com base no código e schema fornecidos no contexto.

Foco extra:
- Fluxos JWT + middleware + apiFetch
- Padrões de erro nas rotas API e impacto na UI
- Consistência de tipos em src/types/index.ts vs respostas reais das rotas
- Uso correto de workspace e soft delete com service role

Segue a estrutura do prompt mestre (14.1). Para cada problema grave, inclui pseudo-diff ou orientação mínima de correção. Declara limitações quando o schema remoto não estiver disponível.
```

---

## 15. Lote exemplo alinhado ao roadmap (referência)

**Lote 01 — SQL/API: pedidos e `workspace` (exemplo)**

- **Objetivo:** reforçar integridade e contratos em `orders` / `order_items` (ex.: versão, concorrência), alinhando API e UI em `src/app/dashboard/sales/`.
- **Ficheiros prováveis:** `sql/*.sql`, `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/route.ts`, `src/app/dashboard/sales/page.tsx`, `src/types/index.ts`.
- **Risco:** médio (fluxo comercial).
- **Validação:** cenário de update concorrente; `npm run build`; verificação no Supabase coerente com o código.

*(Ajustar sempre com o mapa de impacto real do Cursor.)*

---

## 16. Referência cruzada

- Entrega de patches e âncoras: [`AGENTES.md`](../AGENTES.md)  
- Índice geral: [`docs/index.md`](index.md)

---

*Última atualização deste playbook: alinhada ao repositório VisitAgro com documentação em `docs/`, Node 20.x, Next 14, e fluxo ChatGPT → Cursor → Claude.*
