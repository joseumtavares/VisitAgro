# Kit Fortsul + VisitAgro (baseado no modelo aprovado)

Este kit foi regenerado usando exatamente o modelo enviado pelo usuário como base principal.

## Arquivos recomendados

- `visitagro-fortsul-logo-login.(png|svg)`  
  Uso: tela de login, splash, onboarding.

- `visitagro-fortsul-logo-sidebar.(png|svg)`  
  Uso: sidebar, header principal, menu lateral.

- `visitagro-fortsul-dashboard-badge.(png|svg)`  
  Uso: página inicial/dashboard, cards institucionais, topo do painel.

- `visitagro-fortsul-header-badge.(png|svg)`  
  Uso: cabeçalhos compactos, widgets menores.

- `visitagro-fortsul-main-hero.(png|svg)`  
  Uso: banner da página principal.

- `visitagro-fortsul-icon.(png|svg)`  
  Uso: ícone geral da aplicação.

- `visitagro-fortsul-icon-192.(png|svg)` e `visitagro-fortsul-icon-512.(png|svg)`  
  Uso: PWA / manifest.

- `visitagro-fortsul-favicon.(png|svg)`  
  Uso: favicon no `app/layout.tsx`.

- `visitagro-fortsul-apple-touch-icon.png`  
  Uso: ícone Apple touch.

## Sugestão de uso em Next.js

```ts
export const metadata = {
  title: 'VisitAgro',
  icons: {
    icon: '/branding/visitagro-fortsul-favicon.png',
    apple: '/branding/visitagro-fortsul-apple-touch-icon.png',
  },
}
```

## Estratégia visual aplicada

- mantém a base dark + verde do sistema
- usa o símbolo Fortsul dentro do pin/marker aprovado
- evita contaminar os componentes funcionais do sistema
- concentra a personalização em branding, login e badges
