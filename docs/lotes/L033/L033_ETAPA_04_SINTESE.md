# L033 — ETAPA 04 — Síntese Final

## Resumo executivo do lote
O lote L033 conclui o branding estático mínimo Fortsul + VisitAgro com diff pequeno e seguro. A entrega concentra-se em metadata, branding do login, branding da sidebar, badge institucional no dashboard e atualização documental associada, sem ampliar escopo funcional.

## Consolidação das correções obrigatórias
- `src/app/layout.tsx` atualizado para usar `VisitAgro Pro` e apontar favicon/apple touch icon locais em `/branding`.
- `src/app/auth/login/page.tsx` ajustado para usar a logo de login local, preservando título, subtítulo `Acesse sua conta`, fluxo de autenticação, labels, inputs, placeholders e mensagem final.
- `src/components/layout/DashboardShell.tsx` ajustado para usar a logo lateral local no cabeçalho da sidebar, preservando separador, linha com nome do usuário, `NAV_ITEMS` e item `Mapa`.
- `src/app/dashboard/page.tsx` ajustado para inserir badge institucional acima dos KPIs, preservando cabeçalho, botão `Sair`, cards, mapa rápido e lógica existente.
- `docs/changelog.md` atualizado sem reconstrução do histórico existente, mantendo integralmente o registro já presente em `[0.9.5]`.
- `docs/index.md` atualizado com referências para a síntese final do lote e para o changelog técnico consolidado em `docs/patches/L033.md`.

## Melhorias opcionais aprovadas
- uso de `next/image` nos pontos de branding para manter integração idiomática com Next.js;
- inclusão de um container visual discreto para o badge do dashboard, sem alterar a hierarquia da página;
- organização documental cruzada para facilitar rastreabilidade do lote.

## Itens descartados
- logo dinâmica por empresa;
- manifest/PWA;
- alterações em `next.config.*`;
- refatoração ampla;
- banco, migrations ou SQL;
- qualquer mudança fora do escopo de branding estático mínimo.

## Bloco de preservação
Preservar explicitamente:
- `RootLayout`, providers, estrutura de `html/body` e classes globais;
- `handleSubmit`, `loading`, `error`, `login(data.user, data.token)` e `router.push('/dashboard')` do login;
- labels, inputs, placeholders e mensagem final do card de login;
- wrapper do cabeçalho da sidebar, borda/separador, linha do nome do usuário e `NAV_ITEMS`;
- uso de `Map` no item `/dashboard/map`;
- cabeçalho `Dashboard`, botão `Sair`, cards, mapa rápido e lógica de carregamento/auth/fetch/estado;
- ausência total de SQL neste lote.

## Instruções de geração de arquivos
Gerar e entregar integralmente os arquivos finais nos paths abaixo:
- `public/branding/visitagro-fortsul-favicon.png`
- `public/branding/visitagro-fortsul-apple-touch-icon.png`
- `public/branding/visitagro-fortsul-logo-login.svg`
- `public/branding/visitagro-fortsul-logo-sidebar.svg`
- `public/branding/visitagro-fortsul-dashboard-badge.svg`
- `src/app/layout.tsx`
- `src/app/auth/login/page.tsx`
- `src/components/layout/DashboardShell.tsx`
- `src/app/dashboard/page.tsx`
- `docs/index.md`
- `docs/changelog.md`
- `docs/lotes/L033_ETAPA_04_SINTESE.md`
- `docs/patches/L033.md`

## Critério de encerramento
O lote só pode ser considerado encerrado quando:
1. os arquivos finais acima existirem e estiverem completos;
2. não houver diretórios vazios;
3. `docs/patches/L033.md` estiver em formato de changelog técnico consolidado, e não em pseudo-patch por arquivo;
4. o subtítulo `Acesse sua conta` permanecer visível no login;
5. a documentação estiver cruzada no índice e no changelog;
6. ficar explícito que não houve SQL neste lote.

## Prompt final ao executor — cópia literal integral

```text
Atue como executor final do lote L033 no repositório VisitAgro.

Repositório-base:
https://github.com/joseumtavares/VisitAgro/tree/main

Fonte de verdade obrigatória:
- sempre use a versão real mais recente dos arquivos no repositório;
- não use resumos, pseudo-patches ou saídas anteriores como base primária;
- em conflito entre etapas e repositório atual, use:
  1. arquivo real mais recente do repositório;
  2. ETAPA 03;
  3. ETAPA 02;
  4. ETAPA 01.

Objetivo do lote:
Fechar o branding estático mínimo Fortsul + VisitAgro com diff pequeno e seguro, sem ampliar escopo, entregando arquivos completos editados na íntegra.

## Arquivos que você deve ler no repositório antes de editar

- src/app/layout.tsx
- src/app/auth/login/page.tsx
- src/components/layout/DashboardShell.tsx
- src/app/dashboard/page.tsx
- docs/index.md
- docs/changelog.md
- docs/lotes/README.md
- icons/README-INTEGRACAO.md
- icons/visitagro-fortsul-favicon.png
- icons/visitagro-fortsul-apple-touch-icon.png
- icons/visitagro-fortsul-logo-login.svg
- icons/visitagro-fortsul-logo-sidebar.svg
- icons/visitagro-fortsul-dashboard-badge.svg

## Escopo aprovado

### 1) Assets reais em public/branding
Copiar os 5 assets reais de `icons/` para `public/branding/`:
- visitagro-fortsul-favicon.png
- visitagro-fortsul-apple-touch-icon.png
- visitagro-fortsul-logo-login.svg
- visitagro-fortsul-logo-sidebar.svg
- visitagro-fortsul-dashboard-badge.svg

Você deve entregar os arquivos reais copiados nesses paths:
- public/branding/visitagro-fortsul-favicon.png
- public/branding/visitagro-fortsul-apple-touch-icon.png
- public/branding/visitagro-fortsul-logo-login.svg
- public/branding/visitagro-fortsul-logo-sidebar.svg
- public/branding/visitagro-fortsul-dashboard-badge.svg

### 2) src/app/layout.tsx
Editar sobre a versão atual real do arquivo.

Objetivo:
- ajustar `metadata.title` para `VisitAgro Pro`;
- preservar `description` atual;
- adicionar:
  - `icons.icon = "/branding/visitagro-fortsul-favicon.png"`
  - `icons.apple = "/branding/visitagro-fortsul-apple-touch-icon.png"`

Proibições:
- não alterar `RootLayout`;
- não alterar providers, estrutura do html/body ou classes globais;
- não reformatar o arquivo inteiro sem necessidade.

Entregar:
- `src/app/layout.tsx` completo, já editado.

### 3) src/app/auth/login/page.tsx
Editar sobre a versão atual real do arquivo.

Objetivo:
- substituir o branding visual atual do topo pela logo de login;
- usar asset local:
  - `/branding/visitagro-fortsul-logo-login.svg`

Correção obrigatória:
- o subtítulo `Acesse sua conta` deve permanecer visível;
- não remover o título;
- não remover a hierarquia do cabeçalho do login.

Implementação segura:
- importar `Image` de `next/image`;
- remover `MapPin` do import apenas se ele ficar sem uso;
- preservar integralmente:
  - `handleSubmit`
  - `loading`
  - `error`
  - `login(data.user, data.token)`
  - `router.push('/dashboard')`
  - labels, inputs, placeholders e mensagem final do card

Entrega:
- `src/app/auth/login/page.tsx` completo, já editado.

### 4) src/components/layout/DashboardShell.tsx
Editar sobre a versão atual real do arquivo.

Objetivo:
- substituir apenas o branding do cabeçalho da sidebar pela logo lateral;
- usar asset local:
  - `/branding/visitagro-fortsul-logo-sidebar.svg`

Implementação segura:
- importar `Image` de `next/image`;
- preservar o wrapper do cabeçalho, a borda/separador e a linha com o nome do usuário;
- preservar `NAV_ITEMS`;
- preservar o uso de `Map` no item `/dashboard/map`;
- remover `Map` do import somente se ele realmente ficar sem uso fora do branding do cabeçalho.

Entrega:
- `src/components/layout/DashboardShell.tsx` completo, já editado.

### 5) src/app/dashboard/page.tsx
Editar sobre a versão atual real do arquivo.

Objetivo:
- inserir o badge institucional antes dos KPIs, com o menor diff seguro;
- usar asset local:
  - `/branding/visitagro-fortsul-dashboard-badge.svg`

Implementação segura:
- importar `Image` de `next/image`;
- inserir o badge entre o bloco de cabeçalho do dashboard e o grid de stats, ou em posição equivalente de mesmo efeito visual;
- não remover o cabeçalho `Dashboard`;
- não remover o botão `Sair`;
- não remover cards;
- não remover mapa rápido;
- não alterar lógica de carregamento, auth, fetch ou estado.

Entrega:
- `src/app/dashboard/page.tsx` completo, já editado.

### 6) docs/changelog.md
Editar sobre a versão atual real do arquivo.

Regra obrigatória:
- partir do arquivo atual do repositório, que já contém entrada `[0.9.5]`;
- não reconstruir do zero;
- não apagar a funcionalidade já registrada em `[0.9.5]`.

Alteração esperada:
- acrescentar uma anotação curta do lote L033 sob a versão atual já existente, por exemplo em uma subseção como `### 🎨 Branding / UI — L033`, registrando:
  - metadata com favicon/apple touch icon;
  - branding do login;
  - branding da sidebar;
  - badge no dashboard;
  - subtítulo do login preservado.

Entrega:
- `docs/changelog.md` completo, já editado.

### 7) docs/index.md
Editar sobre a versão atual real do arquivo.

Regra obrigatória:
- partir do arquivo atual do repositório;
- preservar a navegação existente.

Alteração esperada:
- adicionar link para:
  - `./lotes/L033_ETAPA_04_SINTESE.md`
- adicionar referência para:
  - `./patches/L033.md`
com o menor diff possível, em local coerente com a estrutura atual do índice.

Entrega:
- `docs/index.md` completo, já editado.

### 8) docs/lotes/L033_ETAPA_04_SINTESE.md
Criar este arquivo com conteúdo completo.

Obrigatório conter:
- resumo executivo do lote;
- consolidação das correções obrigatórias;
- melhorias opcionais aprovadas;
- itens descartados;
- bloco de preservação;
- instruções de geração de arquivos;
- critério de encerramento;
- uma cópia literal integral deste prompt final ao executor.

Entrega:
- `docs/lotes/L033_ETAPA_04_SINTESE.md` completo.

### 9) docs/patches/L033.md
Criar este arquivo com conteúdo completo.

Regra obrigatória:
- este arquivo deve ser um changelog técnico consolidado do lote;
- não deve ser pseudo-patch por arquivo;
- não deve conter “substitua este trecho por aquele” como formato principal;
- deve registrar:
  - objetivo do lote;
  - arquivos finais entregues;
  - documentação alterada;
  - validação executada;
  - observação de que não houve SQL neste lote.

Entrega:
- `docs/patches/L033.md` completo.

## Proibições absolutas

Não entregar:
- diretórios vazios;
- arquivos `.md` em substituição a arquivos técnicos alterados;
- pseudo-patches por arquivo em `docs/patches/`;
- listas soltas de diff sem os arquivos reais completos;
- placeholders;
- skeletons;
- mudanças em:
  - middleware.ts
  - src/lib/supabaseAdmin.ts
  - src/lib/auth.ts
  - src/lib/apiFetch.ts
  - src/store/authStore.ts
  - src/types/index.ts
  - src/app/api/**
  - sql/**

Não ampliar escopo para:
- logo dinâmica por empresa;
- manifest/PWA;
- next.config.js;
- refatoração ampla;
- banco ou migrations.

## Regra de SQL
Este lote não possui SQL aprovado.
Portanto:
- não criar arquivo em `/sql` neste L033;
- não criar nada SQL em `docs/patches/`.

Se surgir dependência real de SQL para concluir algo, pare e trate como bloqueador de escopo, não como ajuste improvisado.

## Regra de entrega final
Você deve entregar os arquivos completos e finais, na íntegra, nestes paths:

- public/branding/visitagro-fortsul-favicon.png
- public/branding/visitagro-fortsul-apple-touch-icon.png
- public/branding/visitagro-fortsul-logo-login.svg
- public/branding/visitagro-fortsul-logo-sidebar.svg
- public/branding/visitagro-fortsul-dashboard-badge.svg
- src/app/layout.tsx
- src/app/auth/login/page.tsx
- src/components/layout/DashboardShell.tsx
- src/app/dashboard/page.tsx
- docs/index.md
- docs/changelog.md
- docs/lotes/L033_ETAPA_04_SINTESE.md
- docs/patches/L033.md

## Validação mínima obrigatória
- confirmar presença dos 5 assets em `public/branding/`;
- npm run lint;
- npm run build;
- testar `/auth/login` com subtítulo `Acesse sua conta` preservado;
- testar shell autenticado com logo, nome do usuário e item `Mapa`;
- testar `/dashboard` com badge acima dos KPIs;
- validar favicon e apple touch icon.

## Saída esperada
Retornar com:
1. lista objetiva dos arquivos finais entregues;
2. confirmação explícita de que todos foram gerados na íntegra;
3. confirmação explícita de que não há diretórios vazios;
4. confirmação explícita de que não há pseudo-patches por arquivo em `docs/patches/`;
5. confirmação explícita de que `Acesse sua conta` foi preservado;
6. resultado das validações.
```
