Atue como engenheiro sênior no repositório VisitAgro e implemente um patch cirúrgico de branding/UI, com o menor diff seguro possível, sem alterar funcionamento, regras de negócio, autenticação, navegação, store, middleware, backend ou contratos de API.

==================================================
PROJETO
==================================================

Repositório:
https://github.com/joseumtavares/VisitAgro

Lote:
Branding Fortsul + VisitAgro — Fase 1 — patch mínimo seguro

Meta:
Aplicar branding estático do produto em pontos centrais do sistema:
1. favicon / ícones globais
2. tela de login
3. sidebar global
4. topo do dashboard

Sem interferir em:
- login
- logout
- redirects
- navegação
- permissões
- store
- API
- dashboard funcional
- rotas
- banco
- middleware
- settings dinâmico

==================================================
LEITURA OBRIGATÓRIA ANTES DE QUALQUER ALTERAÇÃO
==================================================

Leia primeiro, nesta ordem:
1. docs/AGENTES.md
2. docs/playbook-operacional.md
3. icons/README-INTEGRACAO.md
4. src/app/layout.tsx
5. src/app/auth/login/page.tsx
6. src/components/layout/DashboardShell.tsx
7. src/app/dashboard/page.tsx
8. tailwind.config.js
9. src/styles/globals.css
10. src/app/dashboard/settings/page.tsx
11. src/app/api/settings/company/route.ts
12. src/types/index.ts

Você deve se basear no código real e nos arquivos reais acima.
Não invente caminhos.
Não invente arquitetura.
Não proponha redesign genérico.

==================================================
CONTEXTO REAL QUE DEVE SER RESPEITADO
==================================================

O projeto usa:
- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Zustand
- Supabase
- Lucide React

Pontos reais já existentes no repositório:
- `src/app/layout.tsx` é o ponto central de metadata e branding global do app.
- `src/app/auth/login/page.tsx` já possui um bloco visual de marca, hoje com ícone Lucide.
- `src/components/layout/DashboardShell.tsx` já possui um cabeçalho/branding de sidebar, hoje com ícone Lucide + texto.
- `src/app/dashboard/page.tsx` é o melhor ponto para inserir badge/hero com baixo risco.
- `icons/README-INTEGRACAO.md` já documenta quais assets usar em cada ponto.
- `src/types/index.ts` já tem `logo_url` no tipo `Company`, e há rota de settings/company, mas isso NÃO deve virar funcionalidade dinâmica neste lote.

==================================================
OBJETIVO EXATO DESTE LOTE
==================================================

Implementar branding estático e cirúrgico usando os assets já existentes do kit em `icons/`.

O patch deve:
- aplicar favicon e apple touch icon
- trocar o bloco temporário da tela de login por logo real
- trocar o branding temporário da sidebar por logo real
- adicionar badge ou hero no dashboard, com moderação e bom gosto
- harmonizar naming da marca se houver inconsistência textual entre metadata e UI

O patch NÃO deve:
- redesenhar o sistema inteiro
- tocar em lógica de autenticação
- alterar chamadas de API
- alterar store/auth
- alterar middleware
- alterar schema/banco
- criar configuração dinâmica de logo por empresa
- adicionar dependências novas
- fazer refatoração cosmética ampla
- reescrever arquivos inteiros desnecessariamente

==================================================
ASSETS A USAR
==================================================

Use os arquivos reais documentados em `icons/README-INTEGRACAO.md`.

Esperado:
- `visitagro-fortsul-favicon.(png|svg)` → favicon
- `visitagro-fortsul-apple-touch-icon.png` → apple touch icon
- `visitagro-fortsul-logo-login.(png|svg)` → branding da tela de login
- `visitagro-fortsul-logo-sidebar.(png|svg)` → branding da sidebar
- `visitagro-fortsul-dashboard-badge.(png|svg)` → badge do dashboard
- `visitagro-fortsul-main-hero.(png|svg)` → hero do dashboard
- opcionais, só se fizer sentido real:
  - `visitagro-fortsul-header-badge.(png|svg)`
  - `visitagro-fortsul-icon.(png|svg)`
  - `visitagro-fortsul-icon-192.(png|svg)`
  - `visitagro-fortsul-icon-512.(png|svg)`

IMPORTANTE:
Antes de referenciar qualquer asset em JSX/metadata, confirme como esses arquivos serão servidos no runtime.

==================================================
PASSO 0 — VALIDAÇÃO DE SERVING DOS ASSETS
==================================================

Antes de alterar UI:
1. Verifique se a pasta `icons/` está diretamente acessível no runtime.
2. Se NÃO estiver:
   - escolha a menor estratégia segura para servir os arquivos.
3. Estratégias permitidas, em ordem de preferência:
   A. reaproveitar local já público, se existir;
   B. mover/copiar minimamente apenas os assets necessários para o local estático correto;
   C. usar convenções do App Router/metadata do Next.js se isso resultar em menor diff;
4. Explique claramente a estratégia escolhida.
5. Não crie estrutura desnecessária.
6. Não espalhe cópias redundantes de assets.

==================================================
ESCOPO EXATO POR ARQUIVO
==================================================

Você deve trabalhar apenas no menor conjunto possível de arquivos.

Arquivos-alvo principais:
- src/app/layout.tsx
- src/app/auth/login/page.tsx
- src/components/layout/DashboardShell.tsx
- src/app/dashboard/page.tsx

Arquivos auxiliares somente se estritamente necessários:
- algum asset movido/copied para serving estático
- eventualmente arquivo de metadata/icon se a convenção do App Router exigir
- mais nenhum, salvo justificativa forte

Arquivos fora de escopo:
- middleware.ts
- src/lib/apiFetch.ts
- src/store/authStore.ts
- src/lib/supabaseAdmin.ts
- backend
- banco
- migrations
- settings dinâmico de logo
- fluxo de clientes/mapa
- formulários operacionais do sistema

==================================================
CHECKLIST DE DIFF POR ARQUIVO
==================================================

========================================
ARQUIVO 1 — src/app/layout.tsx
========================================

Objetivo:
Centralizar branding global do app, especialmente metadata/icons.

Checklist obrigatório:
[ ] Ler o conteúdo atual do metadata exportado
[ ] Verificar inconsistência de naming da marca
[ ] Adicionar configuração de `icons` no metadata do Next.js, se ainda não existir
[ ] Apontar para favicon correto
[ ] Apontar para apple touch icon correto
[ ] Se fizer sentido técnico e com diff mínimo, apontar outros ícones relacionados
[ ] Ajustar `title` e `description` apenas se necessário para consistência da marca
[ ] NÃO alterar estrutura do RootLayout além do necessário
[ ] NÃO alterar providers, wrappers ou children
[ ] NÃO alterar classes globais sem necessidade

O que preservar:
- estrutura do layout
- imports já necessários
- comportamento global
- tema existente
- funcionamento do app

O que evitar:
- reescrever o arquivo inteiro
- mudar html/body desnecessariamente
- introduzir manifest/PWA complexo se não for indispensável
- adicionar metadados extras fora do escopo

Resultado esperado:
- favicon funcional
- apple touch icon funcional
- branding global mais consistente
- diff mínimo

========================================
ARQUIVO 2 — src/app/auth/login/page.tsx
========================================

Objetivo:
Substituir o bloco atual de marca temporária por logo real, sem tocar na lógica do login.

Checklist obrigatório:
[ ] Identificar o bloco visual atual que usa ícone Lucide
[ ] Substituir esse bloco por componente visual usando o asset de login
[ ] Manter o título/subtítulo adequados à identidade atual
[ ] Ajustar spacing, alinhamento e tamanho da arte apenas o necessário
[ ] Garantir boa exibição em desktop e mobile
[ ] Preservar `use client`
[ ] Preservar imports funcionais
[ ] Preservar estado do formulário
[ ] Preservar `handleSubmit`
[ ] Preservar loading
[ ] Preservar tratamento de erro
[ ] Preservar redirect/navegação
[ ] Preservar acessibilidade básica da tela
[ ] Garantir que a arte não empurre o formulário nem prejudique leitura

O que preservar:
- toda lógica de login
- endpoint/fetch
- UX funcional do formulário
- mensagens de erro
- loading
- botão de submit

O que evitar:
- mudar nomes de variáveis funcionais
- reestruturar a página inteira
- trocar componentes do formulário sem necessidade
- inserir elementos pesados ou decorativos demais
- alterar o comportamento do card de login

Resultado esperado:
- login com marca real
- layout visual melhor
- fluxo funcional intacto

========================================
ARQUIVO 3 — src/components/layout/DashboardShell.tsx
========================================

Objetivo:
Trocar o branding temporário da sidebar por marca real, sem mexer no shell funcional.

Checklist obrigatório:
[ ] Identificar o cabeçalho da sidebar com ícone Lucide + texto
[ ] Substituir por composição com logo real da sidebar
[ ] Preservar estrutura geral da sidebar
[ ] Preservar lista de navegação
[ ] Preservar active states
[ ] Preservar grupos/itens adminOnly
[ ] Preservar ação de logout
[ ] Preservar footer/perfil se houver
[ ] Ajustar somente altura/largura/padding do bloco da marca se necessário
[ ] Garantir boa leitura em resoluções menores
[ ] Garantir que a logo não deforme nem polua o topo da sidebar

O que preservar:
- NAV_ITEMS
- rotas
- lógica de permissões
- clique dos links
- logout
- estrutura operacional do shell

O que evitar:
- alterar navegação
- alterar comportamento responsivo geral sem necessidade
- redesenhar a sidebar inteira
- tocar em lógica de auth/user store

Resultado esperado:
- sidebar com marca real
- leitura melhor
- sem regressão de navegação

========================================
ARQUIVO 4 — src/app/dashboard/page.tsx
========================================

Objetivo:
Adicionar presença de marca no dashboard com o menor impacto visual e funcional possível.

Checklist obrigatório:
[ ] Mapear a hierarquia atual do topo da página
[ ] Escolher entre:
     - badge discreto
     - hero/banner leve
     - ou ambos, apenas se realmente ficar elegante e limpo
[ ] Inserir branding acima dos KPIs ou no cabeçalho, sem empurrar conteúdo crítico
[ ] Preservar cards KPI
[ ] Preservar mapa rápido
[ ] Preservar botões/ações
[ ] Preservar fetches e loading
[ ] Preservar responsividade
[ ] Evitar poluição visual
[ ] Se usar hero, manter altura controlada
[ ] Se usar badge, manter proporção discreta
[ ] Não transformar o dashboard em landing page

O que preservar:
- operação do dashboard
- leitura rápida
- hierarquia funcional
- componentes existentes

O que evitar:
- redesign amplo
- reordenação grande dos blocos
- inserir imagem gigante
- quebrar mobile
- adicionar lógica nova

Resultado esperado:
- dashboard com branding premium e discreto
- mesma usabilidade operacional
- diff mínimo

==================================================
REGRAS DE IMPLEMENTAÇÃO
==================================================

1. Faça o menor patch seguro.
2. Reaproveite padrões e classes existentes.
3. Preserve a paleta dark/primary já existente no projeto.
4. Não introduza nova linguagem visual inteira.
5. Não troque componentes se só precisar ajustar branding.
6. Não misture correção visual com refatoração estrutural.
7. Não toque em arquivos sensíveis fora do escopo.
8. Se um asset não encaixar bem, ajuste o layout minimamente; não aumente escopo.
9. Se hero + badge ficar excessivo, escolha apenas o que ficar melhor.
10. Se houver inconsistência entre “Agrovisita Pro” e “VisitAgro Pro”, normalize conforme a identidade correta do lote.

==================================================
CRITÉRIOS DE ACEITAÇÃO
==================================================

Considere concluído quando:
1. o favicon estiver aplicado corretamente;
2. o apple touch icon estiver configurado corretamente, se suportado pelo fluxo escolhido;
3. a tela de login exibir a marca real sem quebrar o formulário;
4. a sidebar exibir a marca real sem quebrar a navegação;
5. o dashboard exibir badge/hero de forma limpa, discreta e responsiva;
6. a identidade textual estiver consistente entre metadata, login e sidebar;
7. nenhuma funcionalidade existente tiver sido alterada;
8. o patch estiver restrito ao menor conjunto possível de arquivos;
9. a implementação estiver alinhada ao docs/AGENTES.md e ao playbook operacional.

==================================================
TESTES MANUAIS OBRIGATÓRIOS
==================================================

No final, liste testes manuais incluindo no mínimo:

Login:
- [ ] abrir a tela de login e validar layout/branding
- [ ] validar login com credenciais corretas
- [ ] validar exibição de erro com credenciais incorretas
- [ ] validar estado de loading do submit
- [ ] validar que o redirect pós-login continua funcionando

Sidebar:
- [ ] validar exibição da logo
- [ ] navegar entre itens principais
- [ ] validar item ativo
- [ ] validar comportamento do logout
- [ ] validar que itens protegidos continuam corretos

Dashboard:
- [ ] abrir dashboard e validar branding inserido
- [ ] validar que cards KPI continuam visíveis
- [ ] validar que mapa rápido continua acessível
- [ ] validar que não houve overflow ou quebra visual

Branding global:
- [ ] validar favicon na aba do navegador
- [ ] validar apple touch icon se aplicável
- [ ] validar consistência do nome da marca

Responsividade:
- [ ] validar login em viewport estreita
- [ ] validar sidebar/topo em viewport menor
- [ ] validar dashboard em largura reduzida

==================================================
FORMATO OBRIGATÓRIO DA SUA RESPOSTA
==================================================

Responda exatamente em 6 blocos:

1. MAPEAMENTO DO REPOSITÓRIO
- stack confirmada
- arquivos reais lidos
- assets encontrados
- pontos de integração
- áreas sensíveis que não serão alteradas

2. ESTRATÉGIA DE SERVING DOS ASSETS
- como os arquivos serão servidos
- por que essa foi a menor solução segura
- quais arquivos de asset precisarão ser movidos/copied, se houver

3. PLANO DE ALTERAÇÃO
- lista exata de arquivos a alterar
- por que cada um será alterado
- riscos de regressão
- como evitar regressão

4. IMPLEMENTAÇÃO
- patch por arquivo
- âncoras textuais reais
- o que foi alterado
- o que foi preservado
- se criou/moveu arquivo, dizer exatamente qual

5. TESTES MANUAIS
- lista objetiva de testes

6. PONTOS DE ATENÇÃO
- limitações
- decisões tomadas
- próximos refinamentos possíveis
- registrar como oportunidade futura: `logo_url` dinâmico em settings, sem implementar agora

==================================================
RESTRIÇÕES FINAIS
==================================================

- Não invente caminhos.
- Não faça redesign genérico.
- Não amplie o escopo.
- Não altere backend.
- Não altere banco.
- Não altere middleware.
- Não altere store.
- Não altere contratos de API.
- Não reescreva arquivos inteiros sem necessidade.
- Preserve integralmente o comportamento atual do sistema.
- Priorize o menor diff seguro possível.