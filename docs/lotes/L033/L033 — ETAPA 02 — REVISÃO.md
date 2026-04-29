# L033 — ETAPA 02 — REVISÃO

## Classificação geral

**correção obrigatória**

## 1. Resumo executivo

A estratégia do lote está aderente ao repositório no que diz respeito aos arquivos-alvo:
- `src/app/layout.tsx`
- `src/app/auth/login/page.tsx`
- `src/components/layout/DashboardShell.tsx`
- `src/app/dashboard/page.tsx`

Os pontos de integração descritos na ETAPA 01 batem com o código real e o escopo permanece visual, sem impacto em API, banco, autenticação, `workspace` ou `deleted_at`.

Entretanto, o lote ainda não está pronto para integração segura por dois motivos:
1. a ETAPA 01 depende de uma pasta `icons/` e de cópia manual para `public/branding/`, mas essa origem dos assets não está comprovada no repositório atual;
2. a substituição proposta no login remove o texto “Acesse sua conta”, gerando regressão visual desnecessária.

## 2. Pontos aprovados

1. Os quatro paths principais do lote são reais e correspondem aos pontos visuais mapeados.
2. O ajuste em `src/app/layout.tsx` é localizado e de baixo risco.
3. O cuidado em preservar `Map` no `DashboardShell` está correto, porque o ícone também é usado no item `/dashboard/map`.
4. O lote não exige migration, novo SQL ou novo patch documental em `docs/patches/`.
5. O impacto em contratos frontend ↔ API ↔ banco é nulo, desde que o patch permaneça restrito à UI/metadata.

## 3. Correções obrigatórias

1. **Incluir os assets reais no lote**  
   O patch não pode depender apenas de instruções para copiar de `icons/` se essa pasta não estiver presente no repositório/pacote final.  
   O lote deve entregar os arquivos finais em `public/branding/` ou incluir esses arquivos claramente no pacote/manual de aplicação.

2. **Preservar o subtítulo do login**  
   O texto “Acesse sua conta” existe hoje no cabeçalho do login e não deve ser removido.  
   A troca de branding deve substituir o ícone/título visual, mas manter a informação textual já existente.

## 4. Melhorias recomendadas

1. Trocar comandos Unix (`mkdir -p`, `cp`) por instrução de aplicação neutra ou por pacote já estruturado com os novos arquivos.
2. Anexar evidência mínima de validação (`npm run lint`, `npm run build` e checagem visual básica).
3. Ajustar a orientação do changelog para a versão corrente (`0.9.5`) ou próxima versão explícita, sem remeter a `0.9.4`.

## 5. Riscos de regressão

1. Imagens quebradas em runtime se o código for aplicado sem os assets físicos.
2. Regressão de UX no login se o subtítulo for removido.
3. Registro documental inconsistente se o changelog for atualizado na versão errada.

## 6. Bloco de preservação obrigatória

- Preservar toda a lógica do formulário de login (`fetch`, `loading`, `error`, `login`, `router.push`).
- Preservar `NAV_ITEMS` e o uso de `Map` no item `/dashboard/map`.
- Preservar o nome do usuário exibido na sidebar.
- Preservar cabeçalho, botão “Sair”, cards e mapa rápido do dashboard.
- Não alterar `middleware.ts`, `src/lib/supabaseAdmin.ts`, `src/lib/auth.ts`, `src/lib/apiFetch.ts`, `src/store/authStore.ts`, `src/types/index.ts`, `src/app/api/**` e `sql/**`.

## 7. Validações adicionais

1. Confirmar presença dos 5 arquivos em `public/branding/`.
2. `npm run lint`
3. `npm run build`
4. Testar `/auth/login` com logo + subtítulo preservado.
5. Testar shell autenticado com logo + nome do usuário + item “Mapa”.
6. Testar `/dashboard` com badge acima dos KPIs, sem remover cabeçalho e logout.
7. Validar favicon/apple-touch-icon após confirmação dos arquivos físicos.

## 8. Impacto documental

- Criar `docs/lotes/L033_ETAPA_02_REVISAO.md`.
- Registrar `docs/lotes/L033_ETAPA_01_EXECUCAO.md` se ainda não estiver no repo.
- Atualizar `docs/changelog.md` quando o lote entrar.
- `docs/index.md` não exige mudança obrigatória.
- `docs/patches/` e `sql/` não exigem novos arquivos neste lote.

## 9. Veredito

O lote pode evoluir rapidamente para **aprovado com ressalvas** depois de:
- incluir os assets reais no patch/pacote;
- preservar o subtítulo do login;
- alinhar a nota de changelog à versão corrente.