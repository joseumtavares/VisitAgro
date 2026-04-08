# Agrovisita Pro

Sistema completo para gestão de visitas técnicas agrícolas, combinando as melhores funcionalidades do AgrovisitaV3_2 e Visitas 10_3.

## 🚀 Tecnologias Utilizadas

- **Frontend:** Next.js 14 (App Router) com TypeScript
- **Estilização:** Tailwind CSS
- **Backend:** Next.js API Routes
- **Banco de Dados:** PostgreSQL com Supabase
- **Autenticação:** JWT customizado
- **Mapas:** Leaflet + OpenStreetMap com MarkerCluster
- **Estado Global:** Zustand
- **Deploy:** Vercel

## 📋 Funcionalidades

### Do AgrovisitaV3_2
- ✅ Mapa interativo com marcadores coloridos por status
- ✅ Navegação com OpenStreetMap
- ✅ Design moderno com tema escuro
- ✅ Sistema de segurança aprimorado
- ✅ Ícones e logotipos organizados

### Do Visitas 10_3
- ✅ Controle de clientes
- ✅ Cadastro de produtos e categorias
- ✅ Comissões de venda
- ✅ Ambientes/Propriedades
- ✅ Indicadores e comissões de indicadores
- ✅ Cadastro da empresa
- ✅ Agendamento de visitas
- ✅ Pré-cadastro (Leads)
- ✅ Controle de KM (quilometragem)

## 🗄️ Banco de Dados

O schema do banco de dados inclui:

- **companies** - Empresas (multi-tenancy)
- **users** - Usuários com autenticação JWT
- **clients** - Clientes com geolocalização
- **products** - Produtos com estoque e preços
- **categories** - Categorias hierárquicas
- **orders** - Pedidos de venda
- **order_items** - Itens dos pedidos
- **appointments** - Agendamentos de visitas
- **leads** - Pré-cadastros
- **km_logs** - Controle de quilometragem
- **indicators** - Indicadores de desempenho (KPIs)
- **sales_commissions** - Regras de comissão
- **indicator_commissions** - Comissões por indicador
- **commission_payments** - Pagamentos de comissão
- **environments** - Ambientes/propriedades
- **activity_logs** - Histórico de atividades

## 🏗️ Estrutura do Projeto

```
agrovisita-pro/
├── src/
│   ├── app/
│   │   ├── api/              # API Routes
│   │   ├── auth/             # Páginas de autenticação
│   │   └── dashboard/        # Páginas do dashboard
│   ├── components/
│   │   ├── layout/           # Componentes de layout
│   │   ├── map/              # Componentes de mapa
│   │   ├── forms/            # Formulários
│   │   └── ui/               # Componentes UI reutilizáveis
│   ├── lib/                  # Utilitários e configurações
│   ├── services/             # Camada de serviço
│   ├── store/                # Estado global (Zustand)
│   ├── styles/               # Estilos globais
│   └── types/                # Tipos TypeScript
├── public/                   # Arquivos estáticos
├── schema.sql                # Schema do banco de dados
├── vercel.json               # Configuração Vercel
└── package.json
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
JWT_SECRET=sua-chave-secreta-jwt
```

### Instalação

```bash
npm install
```

### Executar em Desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000

### Build de Produção

```bash
npm run build
npm start
```

## 🚀 Deploy no Vercel

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET`
3. O deploy será automático a cada push

## 🔐 Autenticação

O sistema utiliza JWT para autenticação:

- Tokens válidos por 7 dias
- Senhas hasheadas com bcrypt
- Proteção de rotas via middleware
- Multi-tenancy por empresa

## 🗺️ Mapa Interativo

- Leaflet com OpenStreetMap
- Marcadores coloridos por status do cliente:
  - 🔵 Azul: Prospect
  - 🟢 Verde: Ativo
  - ⚫ Cinza: Inativo
  - 🔴 Vermelho: Bloqueado
- Clusterização de marcadores
- Popups com informações do cliente

## 📱 Responsividade

O sistema é totalmente responsivo:
- Menu lateral colapsável em mobile
- Tabelas com scroll horizontal
- Layout adaptativo para todos os dispositivos

## 🎨 Design System

- Tema escuro moderno
- Cores personalizáveis via Tailwind
- Componentes reutilizáveis
- Ícones Lucide React

## 📊 Próximos Passos

1. Implementar CRUD completo de clientes
2. Implementar CRUD de produtos e categorias
3. Implementar sistema de pedidos
4. Implementar agendamentos
5. Implementar controle de KM
6. Implementar indicadores e comissões
7. Adicionar testes automatizados
8. Implementar exportação de relatórios

## 📝 Licença

MIT

---

Desenvolvido com ❤️ para o Agrovisita Pro
