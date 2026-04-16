# 🧪 Teste Local e Publicação Segura

> **Procedimento obrigatório** para validação de alterações antes de commit e publicação.

---

## ⚠️ Regra Absoluta

**Nenhuma alteração deve ser commitada sem:**

1. ✅ Validação local dos paths alterados
2. ✅ Build executado sem erros bloqueantes
3. ✅ Patch SQL aplicado e testado (quando aplicável)
4. ✅ Documentação atualizada
5. ✅ `docs/index.md` atualizado (se novo documento)
6. ✅ Diff revisado

---

## 1. Preparação do Ambiente Local

### 1.1 Instalação do Git

#### Windows
```bash
# Baixe e instale de: https://gitforwindows.org/
# Após instalação, valide:
git --version
```

#### macOS
```bash
# Com Homebrew:
brew install git

# Ou use o Xcode Command Line Tools:
xcode-select --install

# Valide:
git --version
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install git -y

# Valide:
git --version
```

### 1.2 Configuração de Identidade

```bash
git config --global user.name "SEU_NOME"
git config --global user.email "seu@email.com"

# Verifique:
git config --list
```

---

## 2. Cópia do Repositório

### 2.1 Obter URL do Repositório

1. Acesse: https://github.com/joseumtavares/VisitAgro
2. Clique em **Code**
3. Copie a URL (HTTPS ou SSH)

### 2.2 Clonar Repositório

```bash
git clone https://github.com/joseumtavares/VisitAgro.git
cd VisitAgro
```

### 2.3 Verificar Branch Atual

```bash
git branch
# Branch atual será marcado com *
```

### 2.4 Criar Branch de Trabalho

```bash
# Padrão: tipo/descricao-curta
git checkout -b chore/ajuste-documentacao
# ou
git checkout -b feature/nova-funcionalidade
# ou
git checkout -b fix/corrigir-bug
```

---

## 3. Acesso via Shell

### 3.1 Abrir Terminal

- **Windows**: PowerShell, CMD ou Git Bash
- **macOS**: Terminal.app
- **Linux**: Terminal do seu desktop

### 3.2 Navegar até a Raiz do Projeto

```bash
cd /caminho/para/VisitAgro

# Confirmar que está na raiz:
ls
# Deve ver: package.json, src/, docs/, sql/, etc.
```

### 3.3 Comandos Básicos

```bash
# Listar conteúdo
ls -la

# Voltar um nível
cd ..

# Entrar em pasta
cd nome-da-pasta
```

---

## 4. Instalação das Dependências

### 4.1 Identificar Gerenciador de Pacote

Verifique qual lockfile existe:

```bash
ls -la | grep -E "package-lock|pnpm-lock|yarn.lock"
```

- `package-lock.json` → use **npm**
- `pnpm-lock.yaml` → use **pnpm**
- `yarn.lock` → use **yarn**

### 4.2 Instalar Dependências

```bash
# Com npm (recomendado para este projeto):
npm install

# Ou com pnpm:
pnpm install

# Ou com yarn:
yarn install
```

### 4.3 Validar Instalação

```bash
# Não deve haver erros bloqueantes
npm list --depth=0
```

> ⚠️ **Não misture gerenciadores**. Se o projeto usa `npm`, não use `pnpm` ou `yarn`.

---

## 5. Instalação da Vercel CLI

### 5.1 Instalar Globalmente

```bash
npm i -g vercel
```

### 5.2 Validar Instalação

```bash
vercel --version
```

### 5.3 Autenticar

```bash
vercel login
# Escolha método: GitHub, GitLab, Bitbucket ou Email
```

### 5.4 Vincular Projeto

```bash
cd VisitAgro
vercel link
# Siga as instruções no terminal
```

---

## 6. Instalação da Supabase CLI

### 6.1 Instalar

#### macOS
```bash
brew install supabase/tap/supabase
```

#### Windows (Chocolatey)
```bash
choco install supabase
```

#### Linux
```bash
# Consulte: https://supabase.com/docs/guides/cli/getting-started
```

#### npm (alternativa)
```bash
npm install -g supabase
```

### 6.2 Validar Instalação

```bash
supabase --version
```

### 6.3 Autenticar

```bash
supabase login
# Abre navegador para autenticação
```

### 6.4 Inicializar no Projeto (se necessário)

```bash
cd VisitAgro
supabase init
```

---

## 7. Requisito de Docker para Supabase Local

### 7.1 Por Que Docker?

O ambiente local do Supabase depende de containers Docker para:
- Emular banco PostgreSQL
- Rodar funções Edge
- Simular autenticação

### 7.2 Instalar Docker

- **Windows/macOS**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

### 7.3 Validar Docker Rodando

```bash
docker --version
docker ps
```

### 7.4 Iniciar Supabase Local

```bash
cd VisitAgro
supabase start
```

> ⚠️ **Não prossiga com testes de banco sem Docker rodando.**

---

## 8. Configuração de Variáveis de Ambiente

### 8.1 Criar Arquivo `.env.local`

```bash
cp .env.example .env.local
```

### 8.2 Preencher Valores

Edite `.env.local` com suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
JWT_SECRET=sua-secret-jwt
```

### 8.3 Regras de Segurança

- ✅ `.env.local` **nunca** deve ser commitado
- ✅ Use `.env.example` como template seguro
- ✅ Secrets reais ficam apenas no ambiente local e Vercel

---

## 9. Aplicação Local de Patches SQL

### 9.1 Identificar Patch Afetado

```bash
ls sql/
# Exemplo: 020_product_components.sql
```

### 9.2 Ler Documentação do Patch

```bash
cat docs/patches/020_product_components.md
```

### 9.3 Aplicar Patch no Banco Local

```bash
# Com Supabase CLI rodando:
supabase db reset --linked  # Reseta para schema vinculado

# Ou aplique manualmente:
psql -h localhost -p 54322 -U postgres -d postgres -f sql/020_product_components.sql
```

### 9.4 Validar Aplicação

```sql
-- No editor SQL do Supabase Studio ou psql:
\d product_components
-- Deve mostrar colunas criadas/alteredas
```

### 9.5 Cruzar com Documentação

Verifique se:
- ✅ `sql/NNN_nome.sql` existe
- ✅ `docs/patches/NNN_nome.md` existe
- ✅ Colunas documentadas = colunas criadas

---

## 10. Subida do Projeto Localmente

### 10.1 Comando de Desenvolvimento

```bash
cd VisitAgro
npm run dev
```

### 10.2 Observar Logs

O terminal mostrará:

```
✓ Ready in 2s
○ Compiling /dashboard ...
✓ Compiled /dashboard in 500ms
```

### 10.3 Detectar Falhas

Erros comuns:

| Erro | Causa | Solução |
|------|-------|---------|
| `Module not found` | Import incorreto | Verificar path do arquivo |
| `Environment variable not defined` | `.env.local` faltando | Criar/preeencher `.env.local` |
| `Failed to compile` | Erro de sintaxe TypeScript | Corrigir erro apontado |
| `Connection refused` | Supabase não rodando | `supabase start` |

---

## 11. Teste Local dos Paths Afetados

### 11.1 Abrir Navegador

```
http://localhost:3000
```

### 11.2 Validar Carregamento da Página

Para cada path alterado:

1. Acesse a URL no navegador
2. Aguarde carregamento completo
3. Verifique ausência de erros visuais

### 11.3 Validar Navegação

- ✅ Links internos funcionam
- ✅ Sidebar/menu responde
- ✅ Breadcrumbs corretos

### 11.4 Validar Componentes Principais

- ✅ Formulários renderizam
- ✅ Tabelas carregam dados
- ✅ Botões respondem ao clique

### 11.5 Validar Chamadas ao Backend

Abra **DevTools** (F12) → **Network**:

- ✅ Requests HTTP retornam 200/201
- ✅ Sem erros 4xx/5xx
- ✅ Payloads corretos

### 11.6 Validar Integração com Supabase

- ✅ Leitura de dados funciona
- ✅ Escrita/atualização funciona
- ✅ Policies RLS não bloqueiam indevidamente

### 11.7 Checklist de Validação de Path

Para **cada path alterado**, marque:

- [ ] Página carrega sem erro
- [ ] Componentes principais funcionam
- [ ] Navegação relacionada OK
- [ ] API calls retornam sucesso
- [ ] Dados persistem corretamente
- [ ] Logs do shell sem erro bloqueante

---

## 12. Validação Complementar

### 12.1 Lint

```bash
npm run lint
# Deve passar sem erros críticos
```

### 12.2 Typecheck

```bash
npx tsc --noEmit
# Não deve haver erros de tipo
```

### 12.3 Build

```bash
npm run build
# Deve completar com exit code 0
```

### 12.4 Testes Automatizados (se houver)

```bash
npm test
# Ou comando configurado
```

---

## 13. Revisão do Diff Antes de Commit

### 13.1 Verificar Status

```bash
git status
```

### 13.2 Revisar Arquivos Alterados

```bash
git diff
# Veja mudanças linha por linha
```

### 13.3 Evitar Arquivos Indevidos

**NÃO commitar:**

- ❌ `.env.local`
- ❌ `node_modules/`
- ❌ Arquivos temporários
- ❌ Logs locais

### 13.4 Garantir Coerência Docs/Código

Verifique:

- ✅ Novo código tem documentação correspondente
- ✅ `docs/index.md` inclui novos documentos
- ✅ Patches SQL têm espelhamento em `docs/patches/`

---

## 14. Commit Somente Após Teste Aprovado

### 14.1 Preparar Commit

```bash
# Adicionar arquivos específicos (evite git add .)
git add docs/index.md
git add docs/09_teste-local-paths-publicacao-segura.md
git add README.md
```

### 14.2 Mensagem de Commit

Use padrão claro:

```bash
git commit -m "docs: atualiza índice e adiciona procedimento de teste local

- Atualiza docs/index.md para incluir agents/, patches/, lotes/
- Cria docs/09_teste-local-paths-publicacao-segura.md
- Corrige status de pre-registrations no README

Lote: L001_reorganizacao_documental
Validação local: paths testados em http://localhost:3000
Build: OK
Lint: OK"
```

### 14.3 Registrar Escopo Real

Inclua na mensagem:
- O que foi alterado
- O que foi testado
- ID do lote (se aplicável)

---

## 15. Push e Publicação

### 15.1 Enviar Branch ao Remoto

```bash
git push -u origin chore/ajuste-documentacao
```

### 15.2 Validar Deploy (Vercel)

```bash
# A Vercel detecta push automaticamente
# Acompanhe em: https://vercel.com/dashboard
```

### 15.3 Publicar (se aprovado)

```bash
# Pelo dashboard da Vercel ou CLI:
vercel --prod
```

### 15.4 Regra de Publicação

**Nunca publique sem:**

- ✅ Validação local completa
- ✅ Revisão do diff
- ✅ Atualização documental
- ✅ Commit rastreável
- ✅ Push rastreável

---

## 16. Critérios de Bloqueio

### 🚫 Bloqueio Obrigatório

| Condição | Ação |
|----------|------|
| Path não testado localmente | **BLOQUEIA COMMIT** |
| Patch SQL não validado | **BLOQUEIA CONCLUSÃO** |
| Documento novo fora do índice | **BLOQUEIA CONCLUSÃO** |
| Alteração sem rastreabilidade | **BLOQUEIA CONCLUSÃO** |
| Build com erro | **BLOQUEIA COMMIT** |
| Lint com erro crítico | **BLOQUEIA COMMIT** |

### ✅ Critério de Pronto

Uma alteração só está **pronta** quando:

1. ✅ Todos os paths alterados foram testados localmente
2. ✅ Build passou sem erros
3. ✅ Lint passou sem erros críticos
4. ✅ Documentação foi atualizada
5. ✅ `docs/index.md` reflete novos documentos
6. ✅ Diff foi revisado
7. ✅ Commit tem mensagem rastreável
8. ✅ Push foi realizado
9. ✅ Deploy foi validado (quando aplicável)

---

## 17. Fluxo Resumido

```
1. git checkout -b feature/nome
2. npm install
3. npm run dev
4. [aplicar patches SQL se necessário]
5. [testar paths alterados]
6. npm run build
7. npm run lint
8. git diff (revisar)
9. git add [arquivos]
10. git commit -m "mensagem clara"
11. git push
12. [validar deploy na Vercel]
```

---

## 🔗 Referências

- [📖 Central da documentação](./index.md)
- [🤝 Fluxo Multiagente](./agents/00_abertura_operador.md)
- [📝 Changelog](./changelog.md)

---

*Documento criado para garantir segurança operacional e rastreabilidade de todas as alterações no repositório VisitAgro.*
