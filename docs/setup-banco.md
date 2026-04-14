# Setup do Banco

[Central da documentação](./index.md) · [Visão geral](./visao-geral.md) · [Release 0.9.4](./updates-v094.md)

---

## Alerta principal

O schema atual depende da tabela `workspaces` como eixo central. Antes de qualquer operação de inserção, a workspace padrão **`principal`** precisa existir.

## Instalação limpa

### 1. Criar o schema

No SQL Editor do Supabase, execute:

```sql
schema_atual_supabase.sql
```

Se houver restos de versões anteriores com estrutura incompatível, limpe as tabelas antigas antes.

### 2. Ajustar tabelas operacionais

Execute:

```sql
scripts/migration_v2.sql
```

Esse passo cobre ajustes de estrutura que podem faltar em instalações parciais e também prepara dados operacionais essenciais.

### 3. Inserir workspace padrão e admin

Execute:

```sql
scripts/insert_admin.sql
```

Esse script foi pensado para rodar na ordem abaixo:

1. cria a workspace `principal`
2. cria a empresa padrão
3. remove um admin inválido, se existir
4. recria ou atualiza o admin com hash bcrypt válido
5. insere o registro inicial de configurações

## Credenciais iniciais

Após a preparação do banco, o login padrão é:

- usuário: `admin`
- senha: `admin123`

Troque a senha imediatamente após o primeiro acesso.

## Variáveis de ambiente mínimas

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
JWT_SECRET=uma_string_forte_com_32_chars_ou_mais
JWT_EXPIRES_IN=28800
```

## Boas práticas

- Nunca commit `JWT_SECRET` ou `SERVICE_ROLE_KEY`
- Faça a instalação do banco antes de validar o frontend
- Confirme que a workspace `principal` existe antes de testar inserts
- Depois do setup, valide login, criação de cliente e criação de pedido

## Checklist pós-instalação

- [ ] Schema executado sem erro
- [ ] `migration_v2.sql` aplicado
- [ ] `insert_admin.sql` aplicado
- [ ] Workspace `principal` criada
- [ ] Usuário `admin` acessando normalmente
- [ ] Configurações iniciais salvas
- [ ] CRUD de clientes funcionando
- [ ] Pedido com itens inserido com sucesso
