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

**Regra de ouro:** antes de propor código, **abra e leia** os arquivos reais do repositório. Não assuma caminhos, contratos, helpers ou estrutura só pela memória do modelo.

---

## 1. Objetivo da entrega

Toda implementação deve ser:

- **Modular** — permite testar e integrar por partes.
- **Incremental** — melhorias pequenas e reversíveis.
- **Reaproveitando o existente** — estender padrões já usados nas rotas e na UI do dashboard.
- **Mínima em arquivos compartilhados** — tocar só no necessário.
- **Localizável** — quem integra deve saber **onde** aplicar (âncoras de texto, não só número de linha).
- **Pronta para merge** — sem reformatação cosmética em arquivos que outros editam em paralelo.

---

## 2. Antes de escrever código

1. **Mapear o repositório** — árvore sob `src/app`, `src/lib`, `src/components`, `src/store`, `sql/`, `docs/`.
2. **Buscar implementação similar** — mesma entidade (clientes, pedidos, produtos, etc.) ou mesmo padrão (GET com filtros, POST com insert, audit).
3. **Definir contrato** — o que a UI em `src/app/dashboard/**` já espera (JSON, nomes de campos, status HTTP).
4. **Identificar sensibilidade** — ver seção 4.
5. **Planejar validação** — `npm run lint`, `npm run build` quando aplicável, e fluxo manual mínimo descrito na entrega.

---

## 3. Onde procurar antes de criar algo novo

| Necessidade | Onde olhar primeiro |
|-------------|---------------------|
| Lógica server / Supabase admin | `src/lib/supabaseAdmin.ts`, `src/lib/auth.ts`, `src/lib/commissionHelper.ts` |
| Chamadas HTTP da UI | `src/lib/apiFetch.ts` |
| Rotas REST | `src/app/api/**` (espelhar estilo das rotas irmãs) |
| Componentes e layout | `src/components/**`, `DashboardShell` |
| Tipos | `src/types/index.ts` |
| Workspace e usuário na API | `getRequestContext` / headers `x-workspace`, `x-user-id`, `x-user-name`, `x-user-role` |
| Auditoria | `auditLog(...)` em `src/lib/supabaseAdmin.ts` — usar em mutações relevantes, como nas rotas existentes |

Se reutilizar um padrão:

- **Estenda com o menor diff possível**.
- **Descreva na entrega** o que foi reutilizado e por quê.

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

Para estes arquivos:

- **Não reescrever o arquivo inteiro** quando um bloco localizado resolver.
- **Não fazer reorder massivo de imports**.
- **Não rodar reformatação ampla** só por estilo.
- **Não mover blocos existentes** sem necessidade funcional explícita.
- **Não misturar refatoração cosmética com alteração funcional**.

---

## 5. Banco de dados e Supabase

- O cliente **`getAdmin()` ignora RLS** — filtros de **`workspace`**, **`deleted_at`** e autorização devem ser **explícitos na camada da rota**.
- Antes de mudar dados: confirmar **nome da tabela**, **tipos**, **nulabilidade**, **defaults**, **FKs**, **índices**, **triggers**, consumo nas rotas e páginas.
- Alterações de schema devem ser refletidas em **`sql/`** e/ou scripts já usados pelo projeto, de forma **incremental**.
- **Não reescrever arquivos SQL inteiros** se um bloco localizado ou migration incremental resolver.
- **Não misturar**, no mesmo lote, refatoração ampla de schema com feature nova, salvo quando for inevitável e documentado.

---

## 6. Rotas API (`src/app/api/**`)

1. Alinhar com **`middleware.ts`**: rotas públicas vs JWT obrigatório.
2. Preferir **`getRequestContext(request)`** quando precisar de `userId` / `workspace` de forma consistente.
3. Manter **formato de resposta** e códigos HTTP compatíveis com o que `apiFetch` e as páginas já tratam.
4. **Tenancy:** aplicar `.eq('workspace', workspace)` quando a tabela for por workspace.
5. **Soft delete:** aplicar `.is('deleted_at', null)` em listagens/leituras quando aplicável; updates de “remoção” devem seguir o padrão existente (`deleted_at`, `active` ou equivalente).
6. **Auditoria:** usar `await auditLog('...', { ... }, userId)` em operações que alteram dados sensíveis ou regras de negócio, seguindo o padrão das rotas atuais.
7. **Evitar breaking changes silenciosas** em JSON. Se renomear campo ou alterar payload, coordenar API + UI + tipos.

---

## 7. Frontend (`src/app/dashboard/**`, componentes)

1. Identificar **qual rota** alimenta a página e o **formato real** da resposta.
2. **Tipos:** alinhar com `src/types/index.ts` ou com tipos locais já usados na mesma feature.
3. **Não duplicar** transformações que já existem em outro ponto para a mesma entidade.
4. Respeitar **layout, fluxo e naming** do dashboard existente.
5. Preferir **correção localizada** a refatoração ampla não pedida.

Se a UI depender de rota inexistente ou contrato desatualizado, tratar isso como **bloqueador** e corrigir API ou UI de forma coordenada.

---

## 8. Novos arquivos e diretórios

Antes de criar qualquer arquivo ou diretório novo, verificar se a estrutura já existente do repositório comporta essa adição.

### Regras obrigatórias:
- Criar novos arquivos **somente** quando não houver ponto adequado para reaproveitamento ou extensão.
- Criar novos diretórios e subdiretórios **somente** se seguirem o padrão já adotado no projeto.
- Não criar estruturas paralelas, duplicadas ou “temporárias” fora do padrão do repositório.
- Todo arquivo novo deve ter:
  - **caminho completo**;
  - **propósito claro**;
  - **justificativa do local escolhido**.

### Regra prática:
Se já existe um local natural no projeto para aquele tipo de arquivo, ele deve ser usado.

Exemplos:
- rota nova → `src/app/api/...`
- página nova → `src/app/dashboard/...`
- helper novo → `src/lib/...`
- tipo compartilhado → `src/types/index.ts` ou padrão já usado
- documentação nova → `docs/...`

---

## 9. Documentação

Atualizar documentação **no mesmo lote** sempre que a alteração impactar:

- regra de negócio;
- fluxo operacional;
- contrato importante entre API e UI;
- setup;
- variáveis de ambiente;
- status funcional do módulo;
- migrations ou dependências técnicas relevantes.

Arquivos mais comuns:
- `README.md`
- `docs/`
- `.env.example`

### Regras obrigatórias:
- Não deixar o código em estado que contradiga a documentação.
- Não criar documentação genérica duplicada.
- Preferir uma fonte clara e manter consistência entre README e docs técnicas.
- Se a mudança for significativa e a documentação não for atualizada, a entrega está incompleta.

---

## 10. Trabalho em paralelo (vários agentes ou branches)

Assuma que **o mesmo arquivo pode estar sendo editado por outro agente ou branch**.

### Regras obrigatórias:
- Preferir **blocos pequenos** inseridos com **âncora textual única**.
- **Nunca depender só do número de linha**.
- Evitar alterações cosméticas em arquivos compartilhados.
- Evitar reordenação de imports, reformatação ampla, renomeações desnecessárias e mudanças de estilo.
- Destacar arquivos com maior risco de conflito.

### Regra de precisão:
Toda instrução de alteração deve indicar:
- caminho completo do arquivo;
- linha aproximada;
- âncora textual exata;
- se deve inserir antes, inserir depois ou substituir.

Sem âncora textual, a instrução é incompleta.

---

## 11. Formato de entrega

### 11.1 Entrega padrão (Git / PR / merge no repositório)

Quando o fluxo for **commit ou pull request** no mesmo repositório, a resposta final deve conter:

1. **Resumo executivo** (2–5 frases).
2. **Reaproveitamento identificado** — arquivos, rotas, helpers ou padrões usados como base.
3. **Arquivos novos** — caminho completo + propósito.
4. **Arquivos alterados** — lista com sensibilidade (**baixa / média / alta**).
5. **Detalhe por arquivo alterado** — obrigatório para arquivos de sensibilidade média ou alta:
   - **Ação:** criar | alterar | inserir bloco | substituir trecho | remover trecho
   - **Caminho completo**
   - **Motivo**
   - **Linha aproximada**
   - **Âncora textual exata**
   - **Operação:** inserir antes | inserir depois | substituir
   - **Código exato** ou diff conceitual do bloco
   - **O que o bloco faz**
   - **Risco de integração**
   - **Como validar**

### 11.2 Regra para arquivos existentes
Para arquivos existentes:
- preferir patch localizado;
- evitar sobrescrever o arquivo inteiro sem necessidade;
- evitar refatoração ampla junto com feature nova;
- entregar instrução precisa e rastreável.

### 11.3 Entrega por pacote ZIP (integração manual fora do Git)

Usar quando a entrega for **literalmente por cópia de arquivos** ou quando o trabalho vier de conta/agente sem acesso direto ao branch principal.

**Nome obrigatório do pacote:**
- `nome-da-funcionalidade.zip`

Exemplos:
- `controle-comissoes-representantes.zip`
- `cadastro-produtos-compostos.zip`

**Conteúdo mínimo obrigatório:**
```text
nome-da-funcionalidade.zip
├── novos-arquivos/
├── patches/
├── docs/
└── GUIA_APLICACAO.md
```

### 11.4 Regras do pacote ZIP
O pacote deve conter:
1. **novos arquivos** criados;
2. **patches ou instruções** dos arquivos alterados;
3. **documentação atualizada**, quando houver impacto documental;
4. **migrations / SQL / scripts auxiliares**, quando existirem;
5. **`GUIA_APLICACAO.md` obrigatório**.

Se algum item aplicável estiver ausente, a entrega está incompleta.

### 11.5 Conteúdo obrigatório do `GUIA_APLICACAO.md`
O arquivo `GUIA_APLICACAO.md` deve conter, no mínimo:

1. resumo da implementação;
2. objetivo do lote;
3. lista de arquivos novos;
4. lista de arquivos alterados;
5. arquivos sensíveis ou com maior risco de conflito;
6. ordem obrigatória de aplicação;
7. dependências de banco, API, frontend, autenticação, documentação e ambiente;
8. validação mínima após aplicação;
9. riscos conhecidos.

### 11.6 Ordem obrigatória de aplicação
Salvo justificativa técnica explícita, aplicar nesta ordem:

1. banco / migrations / SQL;
2. tipos e contratos compartilhados;
3. helpers e regras centrais;
4. rotas e API;
5. páginas e componentes;
6. documentação;
7. validação final.

### 11.7 Ordem sugerida da resposta final
Para agentes, usar esta ordem na mensagem final:

1. Resumo executivo  
2. Reaproveitamento identificado  
3. Arquivos novos  
4. Arquivos alterados (com sensibilidade)  
5. Detalhe por arquivo (âncora + linha aproximada + operação + código)  
6. Alterações de banco / SQL, se houver  
7. Documentação atualizada, se houver  
8. Estrutura do pacote ZIP + resumo do `GUIA_APLICACAO.md`, se houver  
9. Validação mínima  
10. Riscos de integração  

---

## 12. Critério de aceitação da entrega

Uma entrega só pode ser considerada pronta para integração quando:

- o problema real estiver resolvido no menor escopo seguro;
- o padrão do VisitAgro tiver sido respeitado;
- o reaproveitamento do que já existe tiver sido considerado;
- os arquivos novos estiverem no local correto;
- os arquivos alterados estiverem documentados com precisão;
- os arquivos sensíveis tiverem sido tratados com diff mínimo;
- a documentação necessária tiver sido atualizada;
- a validação mínima estiver descrita;
- os riscos de integração estiverem registrados;
- o pacote ZIP e o `GUIA_APLICACAO.md` existirem, quando esse modo de entrega for aplicável.

Se qualquer um desses pontos falhar, a entrega deve ser tratada como **incompleta**.

---

## 13. Regra final

A melhor entrega:

- resolve o problema real;
- segue padrões do VisitAgro;
- reduz regressões;
- facilita merge manual ou via Git;
- deixa explícito o impacto em API, UI e banco de dados;
- não cria trabalho extra para quem integra.

Quem recebe a entrega deve conseguir responder, sem perguntar de novo:

**“o que mudou, onde mudou e como testar?”**
