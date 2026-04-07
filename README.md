# AgrovisitaPRO

Sistema de gestão de visitas em campo com mapa interativo, combinando o melhor das versões AgrovisitaV3_2 e Visitas 10_3.

## 🚀 Tecnologias

- **Frontend:** Next.js 14 (App Router), React 18, Leaflet + OpenStreetMap
- **Backend:** Next.js API Routes, Node.js
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** JWT (HS256)
- **Deploy:** Vercel

## 📋 Funcionalidades

### Do AgrovisitaV3_2
- ✅ Mapa interativo com OpenStreetMap e Leaflet
- ✅ Marcadores de clientes com cores por status
- ✅ Sistema de segurança aprimorado (JWT, rate limiting, audit log)
- ✅ Controle de KM rodado
- ✅ Design moderno com tema escuro

### Do Visitas 10_3
- ✅ Cadastro completo de clientes com documentos
- ✅ Gestão de produtos e categorias (com FINAME/NCM)
- ✅ Controle de ambientes/talhões
- ✅ Indicadores e comissões de venda
- ✅ Pedidos e itens de pedido
- ✅ Comissões de representantes
- ✅ Agendamento e pré-cadastro
- ✅ Cadastro de empresa

## 🗄️ Banco de Dados

O schema completo está em `schema.sql`. Para configurar:

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o arquivo `schema.sql` no SQL Editor
3. Anote as credenciais (URL, anon key, service role key)

**Login padrão:** `admin` / `J12u08m19t79@`

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# JWT
JWT_SECRET=seu-segredo-jwt-muito-forte
JWT_EXPIRES_IN=28800

# Sync (opcional)
APP_SYNC_KEY=sua-chave-de-sync
```

### Instalação

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

## 🌐 Deploy na Vercel

1. Conecte seu repositório GitHub na Vercel
2. Configure as variáveis de ambiente no painel da Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
3. Deploy automático!

## 📁 Estrutura do Projeto

```
AgrovisitaPro/
├── app/                    # Next.js App Router
│   └── api/               # Rotas de API
├── components/            # Componentes React
├── lib/                   # Utilitários e clientes
│   ├── auth.js           # Autenticação JWT
│   ├── supabase.js       # Cliente Supabase
│   └── uuid.js           # Gerador de UUID
├── services/             # Lógica de negócio
│   └── commissionService.js
├── styles/               # CSS global
│   └── globals.css
├── public/               # Arquivos estáticos
├── middleware.js         # Middleware de autenticação
├── next.config.js        # Configuração Next.js
├── vercel.json           # Configuração Vercel
└── schema.sql            # Schema do banco de dados
```

## 🔒 Segurança

- Autenticação JWT com bcrypt
- Row Level Security (RLS) no Supabase
- Rate limiting para prevenir abusos
- Audit log de todas as ações
- Proteção contra login bruto-force

## 🎨 Design System

Tema escuro moderno com:
- Cores semânticas para status de clientes
- Componentes responsivos
- Animações suaves
- Scrollbars customizadas

## 📊 Status dos Clientes (Cores no Mapa)

| Status | Cor | Badge |
|--------|-----|-------|
| Interessado | Amarelo | `status-interessado` |
| Visitado | Azul | `status-visitado` |
| Agendado | Roxo | `status-agendado` |
| Comprou | Verde | `status-comprou` |
| Não interessado | Vermelho | `status-naointeressado` |
| Retornar | Laranja | `status-retornar` |
| Outro | Cinza | `status-outro` |

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit (`git commit -m 'Adiciona nova feature'`)
4. Push (`git push origin feature/nova-feature`)
5. Pull Request

## 📝 Licença

MIT

---

Desenvolvido com ❤️ usando Next.js e Supabase
