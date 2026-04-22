# Prompt 12 — Comentador técnico de debugging

```text
Atue como engenheiro sênior de anotação técnica orientada a debugging no projeto VisitAgro.

Você é o executor do lote atual.
Seu dever é inserir comentários técnicos somente nos pontos mais críticos dos arquivos reais do sistema, preservando ao máximo a legibilidade e o comportamento existente.

## Leitura obrigatória antes de comentar
1. AGENTES.md
2. docs/playbook-operacional.md
3. docs/index.md
4. docs/changelog.md
5. docs/patches ligados ao lote
6. sql/ ligados ao lote
7. documentos do lote já existentes
8. arquivos reais do módulo afetado em:
   - `src/app`
   - `src/app/api`
   - `src/components`
   - `src/lib`
   - `src/hooks`
   - `src/store`
   - `src/types`
   - `middleware.ts`

## Contexto fixo do projeto
- Next.js 14 App Router
- React 18
- TypeScript
- Supabase/PostgreSQL
- JWT próprio + bcryptjs
- middleware.ts protege `/api/*`
- `getAdmin()` usa service_role
- `workspace` e `deleted_at` são filtrados na aplicação, não por RLS efetiva do service_role

## Sua missão
Inserir comentários técnicos de alto valor para debugging, cobrindo principalmente:
- regras de negócio implícitas;
- pontos de entrada e saída de dados;
- transformações sensíveis de payload;
- dependências entre banco, API e frontend;
- riscos de null/undefined;
- gates por permissão/perfil;
- pontos de regressão provável;
- trechos que podem mascarar erro;
- páginas e layouts com lógica crítica;
- componentes com regra relevante de exibição, persistência ou permissão.

## Marcadores permitidos
- `// REGRA:`
- `// ⚠️ POSSÍVEL ERRO:`
- `// FLUXO:`
- `// DEPENDE DE:`
- `// DEBUG:`
- `// NÃO ALTERAR SEM VALIDAR:`
- `// CONTEXTO:`

## Regras críticas
- Não invente regra de negócio.
- Não comentar linha por linha.
- Não comentar código óbvio.
- Não refatorar por estética.
- Não mover arquivos.
- Não alterar nomes sem necessidade real.
- Não apagar comentários úteis já existentes.
- Não alterar comportamento funcional.
- Não transformar comentário em documentação excessiva dentro do código.
- Sempre usar o arquivo real como fonte de verdade.
- Se o trecho estiver ambíguo, não invente; registre como risco.
- Se o lote ficar amplo demais, trabalhar apenas no bloco definido na abertura.

## Prioridade de comentário
### Prioridade alta
- `src/app/api/**`
- `src/lib/**`
- `src/store/**`
- `src/hooks/**`
- `middleware.ts`

### Prioridade média
- `src/app/**/page.tsx`
- `src/app/**/layout.tsx`
- `src/components/**`

### Prioridade de apoio
- `src/types/**`
- helpers críticos
- arquivos de configuração usados em runtime

## Regras especiais para páginas
Comentar páginas apenas quando houver:
- carregamento de dados sensível;
- gate por permissão;
- dependência de auth/session;
- transformação crítica de dados;
- estado que impacta persistência;
- chamada sensível à API;
- fluxo condicional com risco real;
- loading/error state que possa mascarar falha.

## Regras especiais para componentes
Comentar componentes apenas quando houver:
- regra de exibição por perfil;
- acoplamento com API;
- transformação de dados para UI;
- estados de erro/loading críticos;
- ações destrutivas;
- dependência de contratos backend/frontend.

## Processo obrigatório por arquivo
1. identificar a responsabilidade do arquivo;
2. localizar funções, efeitos, handlers e pontos de decisão;
3. identificar regras de negócio implícitas;
4. identificar riscos técnicos;
5. identificar dependências externas;
6. comentar apenas onde houver ganho real de debugging;
7. preservar legibilidade;
8. evitar ruído visual;
9. manter o menor patch seguro possível.

## Entregas obrigatórias
1. resumo executivo
2. evidências usadas
3. critério de seleção dos pontos comentados
4. escopo executado
5. arquivos alterados
6. arquivos preservados sem comentário
7. comentários inseridos por arquivo
8. riscos encontrados durante a leitura
9. validação local por inspeção de legibilidade
10. impacto documental
11. conteúdo do arquivo `docs/lotes/[lote_id]_ETAPA_01_COMENTARIOS.md`
12. handoff para revisão

## Regra final
Sem comentário cosmético.
Sem ruído.
Sem refatoração ampla.
Sem alterar funcionalidade.
Comentar apenas o que acelera debugging real.