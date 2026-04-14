# Visão Geral do Sistema

[Central da documentação](./index.md) · [Setup do banco](./setup-banco.md) · [Changelog](./changelog.md)

---

## O que é o VisitAgroPro

O **VisitAgroPro** é um sistema web para gestão de visitas comerciais em campo, com foco em operação, acompanhamento de clientes, pedidos, indicadores, comissões e apoio visual via mapa.

## Estado atual do produto

### Módulos estáveis

- Login e controle de acesso
- Clientes
- Produtos
- Indicadores
- Vendas e pedidos
- Comissões de indicadores
- Mapa e check-in
- Configurações
- Manutenção
- Logs administrativos

### Módulos pendentes

- Comissões de representantes
- Controle de KM
- Ambientes e talhões
- Pré-cadastros e leads

## Stack principal

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 + React 18 |
| Estilo | Tailwind CSS |
| Estado global | Zustand |
| Mapa | Leaflet + react-leaflet |
| Banco | Supabase / PostgreSQL |
| Auth | JWT HS256 + bcrypt |
| Deploy | Vercel |

## Organização do projeto

### Pastas mais importantes

- `src/app/` — páginas e rotas de API
- `src/components/` — layout e componentes reutilizáveis
- `src/lib/` — autenticação, clientes Supabase e helpers
- `src/store/` — estado global da autenticação
- `scripts/` — apoio para banco e hash de senha

## Rotas de API por domínio

### Autenticação

- `POST /api/auth/login`
- `POST /api/auth/change-password`

### Operação comercial

- `GET/POST /api/clients`
- `GET/PUT/DELETE /api/clients/:id`
- `GET/POST /api/products`
- `GET/PUT/DELETE /api/products/:id`
- `GET/POST /api/orders`
- `GET/PUT/DELETE /api/orders/:id`
- `GET/POST/PUT/DELETE /api/categories`

### Indicadores e comissões

- `GET /api/commissions`
- `PUT /api/commissions/:id`
- `GET/POST /api/referrals`
- `PUT/DELETE /api/referrals/:id`

### Administração e utilitários

- `GET /api/cep/:cep`
- `GET /api/settings`
- `POST /api/settings/company`
- `GET /api/admin/logs`
- `POST /api/admin/reprocess`
- `POST /api/admin/cleanup`
- `POST /api/admin/pin`

## Fluxo resumido de autenticação

1. O usuário faz login em `/api/auth/login`
2. O backend valida a senha com bcrypt
3. Um JWT é gerado com os dados essenciais do usuário
4. O token é persistido no cliente
5. As chamadas autenticadas usam `Authorization: Bearer <token>`
6. O `middleware.ts` valida o token e injeta contexto da sessão nos headers

## Deploy e execução local

### Desenvolvimento local

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Produção

O fluxo pensado é:

- Banco no Supabase
- Aplicação no Vercel
- Variáveis de ambiente configuradas antes do deploy

## Diretriz editorial para o repositório

Esta página substitui a ideia de um README excessivamente técnico. A home do projeto deve vender o produto e orientar rapidamente; os detalhes ficam concentrados aqui na documentação.
