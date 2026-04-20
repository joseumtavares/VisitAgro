# 📖 Documentação VisitAgro

> Centro de navegação da documentação oficial do projeto.

Bem-vindo à área de documentação do **VisitAgro**.  
Aqui você encontra os materiais de apoio organizados de forma clara, visual e prática para facilitar manutenção, implantação e evolução do sistema.

---

## 🧭 Navegação

### 🚀 Projeto
- [🌱 Visão geral do projeto](../README.md)
- [📝 Changelog](./changelog.md)
- [🆕 Updates da versão 0.9.4](./updates-v094.md)

### 🗄️ Banco de Dados
- [⚙️ Setup do banco](./setup-banco.md)
- [📦 Patches SQL](./patches/)

### 🛡️ Análise Técnica
- [🔍 Auditoria técnica](./auditoria-tecnica.md)

### 🤝 Fluxo Multiagente
- [📋 Playbook Operacional](./playbook-operacional.md)
- [👥 Agentes](./agents/)

### 🧪 Procedimentos Operacionais
- [🧪 Teste Local e Publicação Segura](./09_teste-local-paths-publicacao-segura.md)

### 📦 Controle de Lotes
- [📋 Convenção de Lotes](./lotes/README.md)
- [🧩 Síntese final do lote L033](./lotes/L033_ETAPA_04_SINTESE.md)
- [🛠️ Registro técnico do lote L033](./patches/L033.md)

---

## ✨ O que você encontra aqui

- documentação organizada por tema
- leitura mais fluida do que um README gigante
- base pronta para GitHub Pages
- material ideal para manutenção, handoff e revisão técnica
- fluxo multiagente formalizado
- procedimentos de validação local obrigatórios

---

## 📚 Estrutura Completa da Documentação

### Documentação Principal

| Documento | Descrição |
|-----------|-----------|
| [Visão Geral](./visao-geral.md) | Panorama geral do projeto |
| [Setup do Banco](./setup-banco.md) | Preparação do ambiente de dados |
| [Changelog](./changelog.md) | Histórico de versões |
| [Updates 0.9.4](./updates-v094.md) | Melhorias da versão 0.9.4 |
| [Auditoria Técnica](./auditoria-tecnica.md) | Diagnóstico técnico completo |
| [Playbook Operacional](./playbook-operacional.md) | Guia de operações |
| [Teste Local e Publicação Segura](./09_teste-local-paths-publicacao-segura.md) | Validação obrigatória pré-commit |

### Fluxo Multiagente

| Etapa | Documento | Responsável |
|-------|-----------|-------------|
| 00 | [Abertura do Operador](./agents/00_abertura_operador.md) | Operador |
| 01 | [Executor do Patch](./agents/01_executor_patch.md) | Executor |
| 02 | [Revisor Técnico](./agents/02_revisor_tecnico.md) | Revisor |
| 03 | [Auditor de Segunda Camada](./agents/03_auditor_segunda_camada.md) | Auditor |
| 04 | [Síntese Final](./agents/04_sintese_final_retorno.md) | Consolidador |
| 05 | [Template de Registro de Lote](./agents/05_template_registro_lote.md) | Todos |
| 06 | [Template de Handoff](./agents/06_template_handoff.md) | Todos |
| 07 | [Template de Patch SQL](./agents/07_template_patch_sql.md) | Executor |
| 08 | [Checklist de Fechamento](./agents/08_checklist_fechamento.md) | Todos |

### Patches de Banco de Dados

| Patch | Descrição | Status |
|-------|-----------|--------|
| [020 - Product Components](./patches/020_product_components.md) | Adiciona tabela product_components | ✅ Aplicado |

### Controle de Lotes

- [Convenção de Lotes](./lotes/README.md) - Padrão para registro e rastreamento de lotes
- [Síntese final do lote L033](./lotes/L033_ETAPA_04_SINTESE.md) - Consolidação final do branding estático mínimo
- [Registro técnico do lote L033](./patches/L033.md) - Changelog técnico consolidado do lote

---

## 🧩 Estrutura de Pastas

```text
docs/
├── index.md
├── visao-geral.md
├── setup-banco.md
├── changelog.md
├── auditoria-tecnica.md
├── playbook-operacional.md
├── 09_teste-local-paths-publicacao-segura.md
├── agents/
│   ├── 00_abertura_operador.md
│   ├── 01_executor_patch.md
│   ├── 02_revisor_tecnico.md
│   ├── 03_auditor_segunda_camada.md
│   ├── 04_sintese_final_retorno.md
│   ├── 05_template_registro_lote.md
│   ├── 06_template_handoff.md
│   ├── 07_template_patch_sql.md
│   └── 08_checklist_fechamento.md
├── patches/
│   ├── 020_product_components.md
│   └── L033.md
├── lotes/
│   ├── README.md
│   └── L033_ETAPA_04_SINTESE.md
├── updates/
└── handoffs/
```

---

## 🌐 Publicação com GitHub Pages

Se você ativar o **GitHub Pages** usando `main` + `/docs`, esta página pode virar a entrada do site de documentação do projeto.

> Arquivo recomendado para entrada: `docs/index.md`

---

## 🔗 Acesso rápido

| Página | Descrição |
|--------|-----------|
| [Setup do banco](./setup-banco.md) | Passo a passo de preparação da base |
| [Changelog](./changelog.md) | Histórico resumido e organizado |
| [Updates 0.9.4](./updates-v094.md) | Correções e melhorias mais recentes |
| [Auditoria técnica](./auditoria-tecnica.md) | Diagnóstico e visão de estabilidade |
| [Playbook operacional](./playbook-operacional.md) | Guia de operações diárias |
| [Teste local](./09_teste-local-paths-publicacao-segura.md) | Validação obrigatória antes de commit |
