# VisitAgroPro

> Sistema de gestão de visitas em campo com mapa interativo, clientes, produtos, pedidos, comissões e relatórios.

![Status](https://img.shields.io/badge/status-est%C3%A1vel%20para%20produ%C3%A7%C3%A3o-2ea44f)
![Versão](https://img.shields.io/badge/vers%C3%A3o-0.9.4-0969da)
![Stack](https://img.shields.io/badge/stack-Next.js%2014%20%2B%20Supabase-6f42c1)

## Visão rápida

O **VisitAgroPro** foi projetado para organizar operações comerciais em campo, centralizando cadastro de clientes, pedidos, comissões, indicadores e visitas em um único sistema web.

### Destaques

- Login com JWT e proteção de rotas
- Dashboard com indicadores operacionais
- Mapa interativo com check-in e geolocalização
- CRUD completo de clientes, produtos e indicadores
- Gestão de pedidos com múltiplos itens
- Controle de comissões e auditoria administrativa
- Deploy pensado para **Next.js + Supabase + Vercel**

## Navegação da documentação

| Página | Objetivo |
|---|---|
| [Central da documentação](./docs/index.md) | Página principal da documentação |
| [Visão geral do sistema](./docs/visao-geral.md) | Módulos, stack, estrutura e deploy |
| [Setup do banco](./docs/setup-banco.md) | Instalação limpa e pontos críticos do schema |
| [Changelog](./docs/changelog.md) | Histórico de versões do projeto |
| [Release 0.9.4](./docs/updates-v094.md) | Resumo executivo das últimas correções |
| [Auditoria técnica](./docs/auditoria-tecnica.md) | Resumo do diagnóstico schema × código |

## Status atual

### Implementado

- Login, autenticação e controle de sessão
- Clientes, produtos, pedidos e indicadores
- Mapa com check-in
- Configurações, manutenção e logs administrativos

### Em andamento

- Comissões de representantes
- Histórico de visitas em interface dedicada

### Planejado

- Controle de KM
- Ambientes e talhões
- Pré-cadastros e leads
- Uploads, PDFs e filtros mais avançados

## Início rápido

### 1. Clonar e instalar

```bash
git clone https://github.com/joseumtavares/VisitAgro.git
cd VisitAgro
npm install
```

### 2. Configurar variáveis

```bash
cp .env.example .env.local
```

Preencha as variáveis de ambiente e depois gere um segredo forte para o JWT.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Preparar banco e rodar

Siga o passo a passo completo em [Setup do banco](./docs/setup-banco.md).

```bash
npm run dev
```

## Estrutura sugerida para a home do repositório

Este README foi pensado para ficar **mais limpo, visual e escaneável**, enquanto a documentação detalhada fica concentrada na pasta `docs/`. Isso deixa a página inicial do repositório mais moderna e melhora a descoberta do conteúdo.

## Próximo passo recomendado

Ative o **GitHub Pages** usando a pasta `docs/` como origem para transformar essa documentação em um mini site navegável.
