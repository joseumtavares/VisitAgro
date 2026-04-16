# 🗄️ Setup do Banco de Dados

> Guia rápido para preparar a base do VisitAgro.

---

## 🎯 Objetivo

Esta página reúne a organização do banco para dois cenários comuns:

- **projeto novo**, com schema completo
- **banco já existente**, com aplicação de correções e ajustes

---

## 📦 Arquivos relacionados

| Arquivo | Uso |
|--------|-----|
| `sql/schema_atual_supabase.sql` | Snapshot atual do schema em produção |
| `sql/NNN_nome_patch.sql` | Patches numerados para evolução incremental |
| `scripts/insert_admin.sql` | Inserção de usuário administrador |
| `scripts/generate-password-hash.js` | Geração de hash de senha |
| `scripts/generate-hash-standalone.js` | Geração isolada de hash |

> ⚠️ **Importante:** O arquivo `schema_atual_supabase.sql` representa o snapshot consolidado, mas patches numerados em `sql/` podem conter evoluções posteriores. Sempre verifique ambos.

---

## 🔢 Patches Numerados

Os patches SQL seguem convenção de numeração sequencial:

| Patch | Arquivo | Documentação | Descrição |
|-------|---------|--------------|-----------|
| 020 | `sql/020_product_components.sql` | [docs/patches/020_product_components.md](./patches/020_product_components.md) | Adiciona tabela `product_components` |

### Ordem de Aplicação

1. Para **projeto novo**: execute `sql/schema_atual_supabase.sql`
2. Para **banco existente**: aplique patches numerados subsequentes em ordem
3. Sempre consulte `docs/patches/` para entender impacto de cada patch

---

## 🆕 Cenário 1 — Projeto novo

Quando a base ainda não existe, o caminho recomendado é:

1. criar o projeto no Supabase
2. abrir o editor SQL
3. executar o arquivo `schema_completo_v09.sql`
4. criar o usuário administrador
5. configurar as variáveis de ambiente
6. validar login e rotas principais

### ✅ Ordem sugerida

```bash
1. Executar sql/schema_atual_supabase.sql
2. Aplicar patches numerados subsequentes (se houver)
3. Gerar hash da senha admin
4. Executar scripts/insert_admin.sql
5. Ajustar .env
6. Testar login
```

---

## 🔧 Cenário 2 — Banco existente

Se você já possui uma base anterior e precisa apenas atualizar a estrutura:

1. faça backup do banco atual
2. identifique patches numerados em `sql/` não aplicados
3. aplique patches em ordem sequencial
4. valide tabelas, colunas e índices
5. reprocese dados se necessário

> Antes de aplicar migration em produção, teste em ambiente de homologação.

### Ordem de Aplicação de Patches

```bash
# Listar patches disponíveis
ls sql/*.sql

# Aplicar patches em ordem (exemplo)
psql -h localhost -U postgres -d visitagro -f sql/020_product_components.sql
```

---

## 🔐 Dados sensíveis

Alguns pontos merecem atenção especial:

- uso de `service_role` apenas no servidor
- proteção dos tokens JWT
- controle seguro de senhas com hash
- validação de acesso administrativo

---

## 🧪 Checklist de validação

- [ ] tabelas criadas corretamente
- [ ] usuário admin inserido
- [ ] hash de senha gerado com sucesso
- [ ] login funcionando
- [ ] leitura e escrita nas rotas principais
- [ ] logs administrativos acessíveis ao perfil correto
- [ ] permissões sensíveis restritas ao backend

---

## 📌 Boas práticas

- mantenha backup antes de migrations
- nunca exponha `service_role` no client
- revise scripts SQL antes de aplicar em produção
- documente qualquer ajuste manual realizado na base

---

## 🔗 Voltar

- [📖 Central da documentação](./index.md)
- [🌱 README principal](../README.md)
