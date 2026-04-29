# L042 — ETAPA_00 — REGISTRO FORMAL DO LOTE

## 4.1 Cabeçalho do lote

```text
lote_id          : L042
slug             : performance_basica
título           : Cache seguro de CEP e revisão de performance básica
estado           : bloqueado
origem           : solicitação humana
próximo agente   : Agente 02 — Diagnóstico Técnico de Desbloqueio
```

## 4.2 Contexto

- **Problema observado:** a rota `src/app/api/cep/[cep]/route.ts` consulta ViaCEP diretamente a cada requisição válida de CEP.
- **Causa suspeita:** inexistência de leitura prévia de cache antes da chamada externa.
- **Impacto:** consultas repetidas ao mesmo CEP continuam dependendo de serviço externo, aumentando latência e risco de falha transitória.
- **Conflito documental encontrado:** a tabela `geocode_cache` existente possui apenas `cep`, `lat`, `lng` e `updated_at`. A rota de CEP atual retorna `zip_code`, `address`, `neighborhood`, `city` e `state`. A tela de clientes consome `address`, `city`, `state` e `zip_code` para preencher o formulário. Portanto, usar `geocode_cache` como cache direto de `/api/cep/[cep]` sem guardar endereço, bairro, cidade e UF pode gerar retorno cacheado incompleto.
- **Base documental usada:**
  - `AGENTES.md`: confirma Next.js App Router, rotas em `src/app/api/**/route.ts`, uso de Supabase via `getAdmin()` e alta sensibilidade de `src/lib/supabaseAdmin.ts`.
  - `docs/playbook-operacional.md`: confirma fluxo por lote, DoR/DoD, validação com lint/build e regra de lotes pequenos.
  - `docs/index.md`: confirma documentação central, controle de lotes e patches aplicados.
  - `docs/changelog.md`: confirma histórico recente L036-D/L037/L038 e necessidade de registrar mudanças.
  - `docs/ui/responsividade.md`: lido; não aplicável porque o escopo seguro atual não envolve frontend.
  - `docs/padrao_de_comentarios.md`: confirma tags oficiais `CRITICAL`, `WARNING`, `CONTEXT`, `AI-CONTEXT`, `AI-CONTRACT` e `AI-RULE`.
  - `src/app/api/cep/[cep]/route.ts`: confirma retorno atual de endereço a partir do ViaCEP.
  - `src/lib/supabaseAdmin.ts`: confirma export `getAdmin()`.
  - `sql/schema_atual_v094_supabase.sql`: confirma existência de `geocode_cache`.
  - `src/app/dashboard/clients/page.tsx`: confirma consumo de `/api/cep/${cep}` para preencher `address`, `city`, `state` e `zip_code`.

## 4.3 Escopo

**Incluído:**

- Formalizar o lote L042 como bloqueado até resolver o conflito de contrato entre cache disponível e resposta esperada da rota de CEP.
- Registrar o sub-lote 042.1 — Cache de CEP como intenção técnica válida, mas não executável com o patch proposto sem risco de regressão.
- Registrar que o sub-lote 042.2 — Otimização de Query no Dashboard está fora da abertura atual e deve ser reavaliado em lote posterior, preferencialmente L044, pois depende de suporte novo a `?fields=` nas APIs.
- Preparar prompt de desbloqueio para o próximo agente verificar a melhor alternativa segura:
  - ampliar `geocode_cache` com colunas de endereço via migration;
  - criar tabela específica para cache de CEP;
  - manter ViaCEP para dados de endereço e usar cache apenas para geocodificação, se outro fluxo consumir lat/lng;
  - ajustar frontend e contrato de API somente se isso for formalizado em novo lote.

**Excluído explicitamente:**

- Implementar código em `src/app/api/cep/[cep]/route.ts`.
- Alterar `src/lib/supabaseAdmin.ts`.
- Criar migration SQL nesta abertura.
- Alterar `src/app/dashboard/page.tsx`.
- Adicionar suporte a `?fields=` em `/api/clients`, `/api/products`, `/api/orders`, `/api/commissions` ou `/api/referrals`.
- Alterar frontend, UI, layout ou responsividade.
- Fazer otimização de dashboard no L042.
- Alterar contrato de resposta da rota de CEP sem documentação e validação do consumidor.

## 4.4 Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Cache retornar `address`, `city` e `state` vazios e apagar dados no formulário de cliente | alta | alto | Bloquear implementação até definir cache compatível com o contrato atual da rota |
| Uso de `getAdmin()` sem cuidado por ser service role | média | alto | Manter alteração localizada na rota; não editar `src/lib/supabaseAdmin.ts`; comentar uso com `CRITICAL`/`AI-RULE` se implementado |
| `geocode_cache` não ser a tabela correta para cache de CEP completo | alta | médio | Validar schema e decidir entre migration incremental ou nova tabela específica |
| L042 crescer para backend + frontend + contratos de API | média | médio | Excluir 042.2 e abrir lote posterior para `?fields=` |
| Cache assíncrono com `.then().catch()` mascarar erro de persistência | média | baixo | Aceitar apenas se o cache for otimização não crítica; registrar log se necessário sem bloquear resposta |
| Quebra silenciosa no consumidor `/dashboard/clients` | alta | alto | Validar manualmente o fluxo de busca de CEP em cadastro/edição de cliente antes de fechar |

## 4.5 Definition of Ready

O lote só pode entrar em execução se:

- [ ] Base documental confirmada
- [ ] Escopo revisado e sem ambiguidade
- [ ] Arquivos sensíveis identificados
- [ ] Migration SQL declarada, se a solução escolhida exigir novas colunas ou nova tabela
- [ ] Responsividade verificada, se algum frontend entrar no escopo
- [ ] Contrato atual de `/api/cep/[cep]` preservado ou alteração formalizada com consumidor atualizado
- [ ] Decisão técnica registrada: cache completo de CEP, cache apenas de geocodificação ou postergação
- [ ] Validação do fluxo `/dashboard/clients` definida antes da implementação

## 4.6 Definition of Done

O lote está concluído quando:

- [ ] Todos os itens do escopo aprovado estão implementados
- [ ] Validação mínima aprovada
- [ ] Sem regressão nos pontos declarados
- [ ] Documentação atualizada: `docs/patches/L042_cache_cep.md`, `docs/index.md`, `docs/changelog.md`
- [ ] Segunda consulta ao mesmo CEP tem comportamento validado sem apagar endereço/cidade/UF no cadastro de clientes
- [ ] `npm run lint` executado
- [ ] `npm run build` executado
- [ ] Risco residual registrado no fechamento do lote

## 4.7 Validação mínima

1. **CEP inválido**
   - Contexto de entrada: chamar `GET /api/cep/123`
   - Ação: executar a requisição
   - Resultado esperado: HTTP 400 com `{ error: 'CEP inválido' }`

2. **CEP válido em primeira consulta**
   - Contexto de entrada: CEP válido ainda não cacheado
   - Ação: chamar `GET /api/cep/{cep}`
   - Resultado esperado: resposta com `zip_code`, `address`, `neighborhood`, `city` e `state` preenchidos conforme ViaCEP; sem `_cached: true`

3. **CEP válido em segunda consulta**
   - Contexto de entrada: mesmo CEP consultado anteriormente
   - Ação: chamar `GET /api/cep/{cep}` novamente
   - Resultado esperado: se cache for aprovado, resposta deve indicar `_cached: true` sem perder os campos usados pelo frontend

4. **Fluxo real no cadastro de cliente**
   - Contexto de entrada: abrir `/dashboard/clients`, modal de novo cliente, informar CEP válido
   - Ação: clicar em `Buscar`
   - Resultado esperado: campos `Endereço`, `Cidade`, `Estado` e `CEP` são preenchidos e não ficam vazios em consultas repetidas

5. **Falha no ViaCEP**
   - Contexto de entrada: simular indisponibilidade externa ou resposta não OK
   - Ação: chamar `GET /api/cep/{cep}` sem cache válido
   - Resultado esperado: HTTP 502 com erro controlado, sem crash da rota

6. **Build**
   - Contexto de entrada: repo com patch aplicado
   - Ação: executar `npm run lint` e `npm run build`
   - Resultado esperado: ambos finalizam sem erro

## 4.8 Arquivos envolvidos

**Prováveis:**

```text
src/app/api/cep/[cep]/route.ts
src/app/dashboard/clients/page.tsx
src/lib/supabaseAdmin.ts
sql/schema_atual_v094_supabase.sql
docs/patches/L042_cache_cep.md
docs/index.md
docs/changelog.md
docs/lotes/L042_ETAPA_00_REGISTRO_LOTE.md
```

**Alta sensibilidade**:

```text
src/lib/supabaseAdmin.ts
```

## 4.9 Dependências

- **Migration SQL exigida:** indefinida no estado atual; provável se a decisão for cache completo de CEP.
- **Atualização documental exigida:** sim — `docs/patches/L042_cache_cep.md`, `docs/index.md`, `docs/changelog.md`, `docs/lotes/L042_ETAPA_00_REGISTRO_LOTE.md`.
- **Documentação prévia pendente:** sim — falta decisão formal sobre como preservar o contrato de `/api/cep/[cep]` com cache baseado em tabela que não possui campos de endereço.

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
- [x] Conflito documental encontrado e não registrado

> Resultado da ETAPA_00: **L042 não deve seguir para implementação ainda.** O próximo passo é diagnóstico técnico de desbloqueio para decidir a estratégia segura de cache.
