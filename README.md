# 🌾 Agrovisita Pro — v2.0

Sistema de gestão de visitas e vendas para representantes do agronegócio.
Construído com **Next.js 14**, **Supabase** e **Tailwind CSS**, hospedado na **Vercel**.

---

## ✅ Checklist de Implementação

### 🔐 Autenticação
- [x] Login com username ou email
- [x] JWT próprio (HS256) — sem dependência do Supabase Auth
- [x] Hash de senha bcrypt (com fallback SHA-256 standalone)
- [x] Proteção de rotas autenticadas
- [x] Logout com limpeza de estado

### 🗺️ Mapa de Clientes
- [x] Mapa interativo com Leaflet + OpenStreetMap
- [x] Centro padrão em Santa Catarina (Araranguá)
- [x] Dados reais do banco de dados (não mockados)
- [x] Marcadores coloridos por status do cliente
- [x] Filtros por status no mapa
- [x] Popup com nome, telefone, email, cidade, observação
- [x] Botão Google Maps em cada marcador
- [x] Edição inline no popup (status, telefone, email, obs)
- [x] Mapa rápido no Dashboard (modo compact)
- [x] Auto-centralização nos clientes cadastrados

### 👥 Clientes
- [x] Listagem com busca e filtro por status
- [x] Cadastro completo: nome, status, categoria
- [x] Telefone 1 e Telefone 2
- [x] Email, endereço, cidade, estado
- [x] Busca automática de endereço por CEP (ViaCEP)
- [x] Latitude / Longitude para o mapa
- [x] Link Google Maps (gerado automaticamente com lat/lng)
- [x] Observações
- [x] Edição e exclusão
- [ ] Upload de foto do documento (frente/verso)
- [ ] Upload de comprovante de residência
- [ ] Histórico de visitas por cliente

### 📦 Produtos
- [x] Listagem com busca
- [x] Cadastro: nome, descrição, preço, estoque, unidade
- [x] Edição e exclusão (soft delete)
- [ ] Modelo e cor (colunas adicionadas no BD via migration_v2.sql — falta campo na tela)
- [ ] Upload de fotos do produto
- [ ] Categorias com seleção no cadastro

### 🤝 Indicadores
- [x] Listagem completa
- [x] Cadastro: nome, CPF, telefone, email
- [x] Tipo de comissão: valor fixo ou percentual
- [x] Dados bancários: banco, agência, conta, Pix
- [x] Edição e exclusão (soft delete)

### 🛒 Vendas
- [x] Listagem com busca e filtro por status
- [x] Totalizadores por status (pendente/aprovado/pago/cancelado)
- [x] Cadastro: cliente, indicador, forma de pagamento, status, data
- [x] Adição de múltiplos produtos por pedido
- [x] Cálculo automático de comissão do indicador
- [x] Alteração de status diretamente na listagem
- [x] Geração automática de comissão ao marcar como "Pago"
- [ ] Desconto por pedido (campo existe no BD)
- [ ] PDF/impressão do pedido

### 💰 Comissões
- [x] Listagem com busca e filtro por status
- [x] Totalizadores: a pagar, total pago, total geral
- [x] Confirmar pagamento com 1 clique
- [x] Registro de data/hora do pagamento
- [ ] Upload de comprovante de pagamento
- [ ] Filtro por indicador e período

### 🔧 Manutenção
- [x] Configuração de PIN de segurança (SHA-256)
- [x] Reprocessamento de comissões (pedidos pagos sem comissão)
- [x] Limpeza de dados por grupo (clientes, pedidos, produtos, etc.)
- [x] Confirmação dupla antes de operações destrutivas
- [x] Todas as ações registradas no audit log

### 📋 Logs Administrativos
- [x] Visualização de todas as ações do sistema
- [x] Cores por tipo de ação
- [x] Busca por ação ou usuário
- [x] Limite de 200 registros mais recentes

### ⚙️ Configurações
- [x] Exibição do perfil do usuário logado
- [x] Informações do sistema e ambiente
- [ ] Edição de dados da empresa
- [ ] Configuração de workspace
- [ ] Troca de senha pelo usuário

---

## 🚧 Roadmap — Próximas Implementações

### Alta Prioridade
- [ ] **Registro de Visitas** — agendar, realizar, cancelar visitas a clientes com geolocalização
- [ ] **Upload de Fotos** — fotos de clientes (documentos) e produtos (catálogo)
- [ ] **Controle de KM** — registro de quilometragem por veículo por dia
- [ ] **App Mobile** — PWA com suporte offline (service worker + IndexedDB)

### Média Prioridade
- [ ] **Dashboard com gráficos** — vendas por período, mapa de calor de visitas
- [ ] **Pré-cadastros / Leads** — captura de interessados para conversão
- [ ] **PDF de pedidos** — exportar pedido formatado em PDF
- [ ] **Filtros avançados** — por período, região, representante
- [ ] **Multi-workspace** — suporte a mais de uma empresa/região
- [ ] **Notificações** — alertas de visitas agendadas e comissões a pagar

### Baixa Prioridade
- [ ] **Relatórios** — comissões por período, ranking de clientes, produtos mais vendidos
- [ ] **Gestão de Usuários** — admin criar/editar usuários sem SQL
- [ ] **Ambientes/Talhões** — cadastrar áreas de propriedades dos clientes
- [ ] **Integração WhatsApp** — envio de mensagem direto do sistema
- [ ] **Sync Offline** — sincronização quando retornar conectividade

---

## ⚙️ Configuração do Banco de Dados

### 1. Execute as migrações em ordem

No **SQL Editor do Supabase**:

```
1. scripts/insert_admin.sql     → Cria usuário admin
2. scripts/migration_v2.sql     → Adiciona colunas novas (seguro, usa IF NOT EXISTS)
```

### 2. Tabelas utilizadas pelo sistema

| Tabela | Uso |
|--------|-----|
| `users` | Autenticação — `username`, `pass_hash`, `hash_algo`, `active` |
| `clients` | Clientes com localização, status, contato |
| `products` | Catálogo de produtos |
| `categories` | Categorias de produtos |
| `referrals` | Indicadores com dados bancários |
| `orders` | Pedidos de venda |
| `order_items` | Itens de cada pedido |
| `commissions` | Comissões dos indicadores |
| `audit_log` | Log de todas as ações administrativas |
| `settings` | Configurações do sistema (PIN, workspace) |
| `rate_limits` | Controle de tentativas de login |

### 3. Colunas adicionadas pela migration_v2.sql

| Tabela | Coluna | Tipo | Descrição |
|--------|--------|------|-----------|
| `clients` | `tel2` | TEXT | Telefone 2 |
| `clients` | `category` | TEXT | Categoria do cliente |
| `products` | `model` | TEXT | Modelo do produto |
| `products` | `color` | TEXT | Cor do produto |
| `referrals` | `bank_name` | TEXT | Nome do banco |
| `referrals` | `bank_agency` | TEXT | Agência bancária |
| `referrals` | `bank_account` | TEXT | Conta bancária |
| `referrals` | `bank_pix` | TEXT | Chave Pix |
| `settings` | `dev_pin_hash` | TEXT | Hash SHA-256 do PIN |
| `settings` | `dev_mode_expires` | TIMESTAMPTZ | Expiração do modo dev |

---

## 🔑 Variáveis de Ambiente (Vercel)

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Chave anon (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Service role — nunca expor ao browser |
| `JWT_SECRET` | **Secret** | Mínimo 32 caracteres |
| `JWT_EXPIRES_IN` | Secret | Segundos de validade do token (ex: `28800` = 8h) |

---

## 🚀 Deploy

```bash
# 1. Clone e instale
git clone https://github.com/seu-usuario/VisitAgro
npm install

# 2. Configure .env.local (copie de .env.example)
cp .env.example .env.local

# 3. Execute as migrações no Supabase (SQL Editor)
#    scripts/insert_admin.sql
#    scripts/migration_v2.sql

# 4. Gere a senha do admin (se ainda não fez)
node scripts/generate-password-hash.js admin123

# 5. Rode localmente
npm run dev

# 6. Build de produção
npm run build
```

**Login padrão:** usuário `admin` / senha `admin123`

---

## 🏗️ Arquitetura

```
/
├── docs/                           # Documentação e setup
│   ├── README.md
│   ├── SETUP_BANCO.md
│   └── schema*.sql                 # (3 arquivos)
├── scripts/                        # Scripts & SQL (banco e utilitários)
│   ├── generate-hash-standalone.js
│   ├── generate-password-hash.js
│   ├── insert_admin.sql
│   └── migration_v2.sql
├── src/
│   ├── app/                        # Rotas Next.js
│   │   ├── api/                    # 13 endpoints
│   │   │   ├── admin/              # POST /pin · GET /logs · POST /reprocess · POST /cleanup
│   │   │   ├── auth/               # POST /login · POST /change-password
│   │   │   ├── clients/            # GET · POST (lista) · GET · PUT · DEL [id]
│   │   │   ├── orders/             # GET · POST (lista) · GET · PUT [id]
│   │   │   ├── products/           # GET · POST · GET · PUT · DEL [id]
│   │   │   └── [outros]/           # referrals · commissions · categories · cep · settings
│   │   ├── auth/login/             # Tela de login
│   │   │   └── page.tsx
│   │   ├── dashboard/              # 8 páginas autenticadas
│   │   │   ├── clients/            # Cadastro + CEP
│   │   │   ├── commissions/        # Totalizadores + pagamento
│   │   │   ├── logs/               # Auditoria
│   │   │   ├── maintenance/        # PIN + reprocess + cleanup
│   │   │   ├── map/                # Mapa Leaflet (marcadores por status)
│   │   │   ├── products/           # Preço + estoque
│   │   │   ├── referrals/          # Dados bancários + Pix
│   │   │   ├── sales/              # Pedidos + status
│   │   │   ├── settings/           # Dados da empresa
│   │   │   └── page.tsx            # Dashboard principal (KPIs)
│   │   ├── layout.tsx              # Root layout
│   │   ├── middleware.ts           # Proteção de rotas
│   │   └── page.tsx                # Root page
│   ├── components/                 # UI reutilizável
│   │   ├── layout/
│   │   │   └── DashboardShell.tsx
│   │   └── map/                    # Leaflet map
│   ├── lib/                        # Utilitários
│   │   ├── auth.ts                 # JWT + bcrypt
│   │   ├── commissionHelper.ts     # Lógica de comissões
│   │   ├── supabase.ts             # Client Supabase
│   │   └── supabaseAdmin.ts        # Client admin Supabase
│   ├── store/                      # Zustand auth
│   │   └── authStore.ts            # user · token · isAuthenticated · login() · logout()
│   ├── styles/
│   │   └── globals.css
│   └── types/                      # TypeScript
│       └── index.ts                # User · UserRole · Client · Product · Order...
├── .env.example                    # Configurações de raiz do projeto
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

---

## 📝 Histórico de Versões

| Versão | Data | Principais mudanças |
|--------|------|---------------------|
| v2.0 | Abr/2025 | Vendas, Comissões, Indicadores, Manutenção, Logs, CEP, menu agrupado |
| v1.5 | Abr/2025 | Mapa SC, edição inline, Google Maps, páginas Clientes/Produtos/Settings |
| v1.0 | Abr/2025 | Login JWT funcional, Dashboard, Mapa básico |
