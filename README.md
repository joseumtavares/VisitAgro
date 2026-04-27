# 🌱 VisitAgro

> **Versão atual:** `0.9.7` — **27/04/2026**  
> **Status:** ✅ **Estável para produção** *(correções críticas aplicadas)*

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14.2.35-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-3.4-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-0F172A?style=for-the-badge&logo=supabase&logoColor=3ECF8E">
  <img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white">
</p>

Sistema web para **gerenciamento de visitas comerciais em campo**, com **mapa interativo**, cadastro de clientes, controle de vendas, comissões e relatórios.  
Desenvolvido em **Next.js 14 + Supabase**, com foco em produtividade operacional, segurança e organização comercial.

---

## ✨ Visão Rápida

- 🧭 **Mapa interativo** para visualização e check-in de clientes
- 👥 **Gestão de clientes** com geocodificação e dados comerciais
- 🛒 **Pedidos e vendas** com itens, status e relacionamento de dados
- 💸 **Comissões** para indicadores e fluxo de pagamento
- 📊 **Painéis e relatórios** para acompanhamento do desempenho
- 🔐 **Autenticação JWT** com proteção de rotas e reforço anti brute-force
- 🛠️ **Manutenção administrativa** com limpeza, reprocessamento e logs

---

## ⚡ Status dos Módulos

| Módulo | Rota | Status |
|--------|------|--------|
| Login + brute-force | `/auth/login` | ✅ OK |
| Clientes | `/dashboard/clients` | ✅ OK |
| Produtos | `/dashboard/products` | ✅ OK |
| Indicadores | `/dashboard/referrals` | ✅ OK |
| Vendas / Pedidos | `/dashboard/sales` | ✅ OK |
| Comissões indicadores | `/dashboard/commissions` | ✅ OK |
| Mapa + check-in | `/dashboard/map` | ✅ OK |
| Configurações | `/dashboard/settings` | ✅ OK |
| Manutenção | `/dashboard/maintenance` | ✅ OK |
| Logs administrativos | `/dashboard/logs` | ✅ OK *(admin-only)* |
| Pré-cadastros / leads | `/dashboard/pre-registrations` | 🟡 Parcial (estrutura criada) |
| Comissões representantes | — | 🔴 Pendente |
| Controle de KM | — | 🟡 Pendente |
| Ambientes / talhões | — | 🟡 Pendente |

---

## 🚀 Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Next.js (App Router) | 14.2.35 |
| UI | React | 18 |
| Estilos | Tailwind CSS | 3.4 |
| Ícones | Lucide React | 0.378 |
| Mapas | Leaflet + react-leaflet | 1.9 / 4.2 |
| Geocodificação | Nominatim (OpenStreetMap) | gratuito |
| CEP | ViaCEP API | gratuito |
| Estado Global | Zustand (persist) | 4.5 |
| Banco de Dados | Supabase (PostgreSQL 15) | — |
| Autenticação | JWT HS256 próprio + bcrypt | `jsonwebtoken` / `bcryptjs` |
| Deploy | Vercel (região `gru1` — São Paulo) | — |
| Node.js | Runtime | `>= 20.x < 21` |

---

## 🧱 Estrutura de Diretórios

```text
VisitAgro/
├── src/
│   ├── app/
│   │   ├── auth/login/page.tsx ← Tela de login
│   │   ├── dashboard/
│   │   │   ├── page.tsx ← Dashboard principal
│   │   │   ├── map/page.tsx ← Mapa completo de clientes
│   │   │   ├── clients/page.tsx ← CRUD clientes + geocodificação
│   │   │   ├── products/page.tsx ← CRUD produtos
│   │   │   ├── sales/page.tsx ← Pedidos + itens + comissões
│   │   │   ├── commissions/page.tsx ← Comissões pendentes/pagas
│   │   │   ├── rep-commissions/page.tsx ← Comissões de representantes
│   │   │   ├── referrals/page.tsx ← Indicadores + dados bancários
│   │   │   ├── maintenance/page.tsx ← Reprocessamento + limpeza
│   │   │   ├── logs/page.tsx ← Audit log do sistema
│   │   │   ├── settings/page.tsx ← Empresa, perfil, senha
│   │   │   └── pre-registrations/
│   │   │       ├── page.tsx ← Pré-cadastros
│   │   │       └── pre-registrations-page.tsx ← Componente pré-cadastros
│   │   ├── api/
│   │   │   ├── auth/login/route.ts ← POST (público)
│   │   │   ├── auth/change-password/route.ts ← POST (JWT)
│   │   │   ├── clients/route.ts ← GET/POST
│   │   │   ├── clients/[id]/route.ts ← GET/PUT/DELETE
│   │   │   ├── products/route.ts ← GET/POST
│   │   │   ├── products/[id]/route.ts ← GET/PUT/DELETE
│   │   │   ├── orders/route.ts ← GET/POST
│   │   │   ├── orders/[id]/route.ts ← GET/PUT/DELETE
│   │   │   ├── commissions/route.ts ← GET
│   │   │   ├── commissions/[id]/route.ts ← PUT (pagar)
│   │   │   ├── rep-commissions/route.ts ← GET/POST (comissões rep)
│   │   │   ├── rep-commissions/[id]/route.ts ← PUT/DELETE
│   │   │   ├── referrals/route.ts ← GET/POST
│   │   │   ├── referrals/[id]/route.ts ← PUT/DELETE
│   │   │   ├── categories/route.ts ← GET/POST/PUT/DELETE
│   │   │   ├── cep/[cep]/route.ts ← GET (proxy ViaCEP)
│   │   │   ├── geocode/route.ts ← Geocodificação de endereços
│   │   │   ├── health/route.ts ← Health check
│   │   │   ├── visits/route.ts ← Registro de visitas
│   │   │   ├── pre-registrations/route.ts ← GET/POST pré-cadastros
│   │   │   ├── pre-registrations/[id]/route.ts ← GET/PUT/DELETE
│   │   │   ├── pre-registrations/[id]/convert/route.ts ← Converter em cliente
│   │   │   ├── settings/route.ts ← GET
│   │   │   ├── settings/company/route.ts ← POST
│   │   │   └── admin/
│   │   │       ├── cleanup/route.ts ← POST
│   │   │       ├── logs/route.ts ← GET
│   │   │       ├── pin/route.ts ← POST
│   │   │       └── reprocess/route.ts ← POST
│   │   ├── layout.tsx ← Layout root
│   │   └── page.tsx ← Landing page / redirect
│   ├── components/
│   │   ├── layout/DashboardShell.tsx ← Sidebar + navegação
│   │   └── map/
│   │       ├── InteractiveMap.tsx ← Mapa Leaflet completo
│   │       ├── LeafletProvider.tsx ← SSR-safe wrapper
│   │       └── GpsPickerMap.tsx ← Seletor GPS no mapa
│   ├── lib/
│   │   ├── apiFetch.ts ← fetch autenticado (injeta JWT)
│   │   ├── auth.ts ← verifyPassword, JWT
│   │   ├── supabase.ts ← cliente anon (client)
│   │   ├── supabaseAdmin.ts ← service_role (server-only)
│   │   ├── commissionHelper.ts ← geração de comissões
│   │   ├── repCommissionHelper.ts ← comissões de representantes
│   │   ├── productCompositeHelper.ts ← produtos compostos
│   │   └── requestContext.ts ← contexto de requisição
│   ├── store/authStore.ts ← Zustand auth state
│   ├── types/index.ts ← Tipos TypeScript
│   └── styles/globals.css ← Estilos globais
├── scripts/
│   ├── generate-password-hash.js ← Gerar hash de senha
│   └── generate-hash-standalone.js ← Hash standalone
├── sql/
│   ├── schema_atual_supabase.sql ← Schema atual do banco
│   ├── insert_admin.sql ← Insert admin
│   ├── 020_product_components.sql ← Migration produtos compostos
│   └── 030_rep_commissions_rep_id.sql ← Migration comissões rep
├── docs/
│   ├── index.md ← Documentação principal
│   ├── visao-geral.md ← Visão geral do projeto
│   ├── setup-banco.md ← Setup do banco de dados
│   ├── changelog.md ← Histórico de mudanças
│   ├── playbook-operacional.md ← Playbook operacional
│   ├── auditoria-tecnica.md ← Auditoria técnica
│   ├── updates-v094.md ← Atualizações v0.9.4
│   ├── AGENTES.md ← Documentação de agentes
│   ├── agents/ ← Prompts e instruções de agentes
│   ├── comunications_agents/ ← Comunicação entre agentes
│   ├── lotes/ ← Registros de lotes de execução
│   └── patches/ ← Documentação de patches
├── public/
│   └── branding/ ← Assets de marca
├── icons/
│   └── README-INTEGRACAO.md ← Integração de ícones
├── middleware.ts ← Proteção JWT de /api/* e rotas
├── package.json
├── package-lock.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vercel.json
├── .env.example
├── .vscode/launch.json ← Configuração debug VSCode
├── gerar_projeto.js ← Script gerador de projeto
└── generate-hash-standalone.js ← Script hash standalone (raiz)
```

---

## 🔑 API Routes

### 🔓 Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login → retorna JWT (username ou email) |
| POST | `/api/auth/change-password` | Troca senha *(requer JWT)* |

### 📦 Clientes / Produtos / Pedidos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/clients` | Listar / criar |
| GET/PUT/DELETE | `/api/clients/:id` | Buscar / atualizar / excluir |
| GET/POST | `/api/products` | Listar / criar |
| GET/PUT/DELETE | `/api/products/:id` | Buscar / atualizar / desativar |
| GET/POST | `/api/orders` | Listar / criar *(+ itens em `order_items`)* |
| GET/PUT/DELETE | `/api/orders/:id` | Buscar / atualizar status / cancelar |
| GET/POST/PUT/DELETE | `/api/categories` | CRUD categorias |

### 💼 Comercial
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/commissions` | Comissões do indicador |
| PUT | `/api/commissions/:id` | Pagar comissão |
| GET/POST | `/api/referrals` | Listar / criar indicadores |
| PUT/DELETE | `/api/referrals/:id` | Atualizar / desativar |

### 🛠️ Utilitários / Administração
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/cep/:cep` | Proxy ViaCEP |
| GET | `/api/settings` | Config + empresa |
| POST | `/api/settings/company` | Salvar empresa |
| GET | `/api/admin/logs` | 200 registros `audit_log` |
| POST | `/api/admin/reprocess` | Reprocessar comissões |
| POST | `/api/admin/cleanup` | Limpar dados por grupo |
| POST | `/api/admin/pin` | Configurar PIN admin |

> 🔐 **Todas as rotas**, exceto `/api/auth/login`, exigem `Authorization: Bearer <token>`.

---

## 📚 Documentação Complementar

> A documentação detalhada foi organizada em páginas separadas para manter a home do repositório forte, limpa e profissional.

| Documento | Objetivo |
|-----------|----------|
| [📖 Central da documentação](./docs/index.md) | Navegação principal |
| [🗄️ Setup do banco](./docs/setup-banco.md) | Instalação e banco de dados |
| [📝 Changelog](./docs/changelog.md) | Histórico de versões |
| [🆕 Updates 0.9.4](./docs/updates-v094.md) | Melhorias e correções aplicadas |
| [🛡️ Auditoria técnica](./docs/auditoria-tecnica.md) | Resumo técnico das análises |

---

## 🎯 Direção do Projeto

O VisitAgro está pronto para uso produtivo na sua base atual e possui uma trilha clara de evolução para:

- 📍 controle de KM
- 🌾 ambientes e talhões
- 🤝 pré-cadastros e leads
- 💼 comissões de representantes
- 📈 expansão dos relatórios analíticos

---

## 👨‍💻 Observações Finais

Este repositório foi estruturado para manter um equilíbrio entre:

- **clareza operacional**
- **segurança**
- **escalabilidade**
- **manutenção facilitada**

Se quiser transformar esta documentação em um site navegável, basta publicar a pasta [`docs/`](./docs/index.md) com **GitHub Pages**.
