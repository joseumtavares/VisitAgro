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
| `schema_completo_v09.sql` | Estrutura completa para banco novo |
| `schema_fix.sql` | Ajustes e correções para banco existente |
| `scripts/insert_admin.sql` | Inserção de usuário administrador |
| `scripts/generate-password-hash.js` | Geração de hash de senha |
| `scripts/generate-hash-standalone.js` | Geração isolada de hash |

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
1. Executar schema_completo_v09.sql
2. Gerar hash da senha admin
3. Executar scripts/insert_admin.sql
4. Ajustar .env
5. Testar login
```

---

## 🔧 Cenário 2 — Banco existente

Se você já possui uma base anterior e precisa apenas atualizar a estrutura:

1. faça backup do banco atual
2. revise diferenças de schema
3. execute `schema_fix.sql`
4. valide tabelas, colunas e índices
5. reprocese dados se necessário

> Antes de aplicar migration em produção, teste em ambiente de homologação.

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
