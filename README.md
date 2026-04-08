# Agrovisita Pro 🚜

Sistema escalonável de gestão agrícola desenvolvido com Next.js 14, TypeScript e Supabase.

## 🚀 Funcionalidades

- **Autenticação JWT** segura
- **Mapa Interativo** com Leaflet e OpenStreetMap
- **Gestão de Clientes** com geolocalização e status por cores
- **Controle de Pedidos** e Produtos
- **Comissões** de venda e indicadores
- **Agendamentos** de visitas técnicas
- **Multi-tenancy** (múltiplas empresas)

## ⚙️ Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e preencha.

3. Execute o script `schema.sql` no painel do Supabase.

4. Gere o hash da senha admin:
   ```bash
   node scripts/generate-password-hash.js admin123
   ```

5. Rode o projeto:
   ```bash
   npm run dev
   ```

## 🔐 Acesso Inicial

- **Email:** admin@agrovisita.com.br
- **Senha:** admin123
