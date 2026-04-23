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
- [🧪 Teste Local e Publicação Segura](./agents/09_teste-local-paths-publicacao-segura.md)

### 📦 Controle de Lotes
- [📋 Convenção de Lotes](./lotes/README.md)
- [🔐 L036-A — Controle de acesso representative](./lotes/L036-A_ETAPA_01_EXECUCAO.md)
- [🛠️ Registro técnico do lote L033](./patches/L033.md)

### 🩹 Patches aplicados
- [📱 L037 — Responsividade mobile](./patches/L037_responsividade.md)
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
| [Teste Local e Publicação Segura](./agents/09_teste-local-paths-publicacao-segura.md) | Validação obrigatória pré-commit |

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
| [030 - Rep Commissions rep_id](./patches/030_rep_commissions_rep_id.md) | rep_id e rep_name em rep_commissions | ✅ Aplicado |
| [040 - Rep Commissions indexes](./patches/040_rep_commissions_indexes.md) | Índices de unicidade e performance | ✅ Aplicado |
| [050 - Representative Role](./patches/050_representative_role.md) | Perfil representative + índices rep_regions | ✅ Aplicado |

### Controle de Lotes

| Lote | Arquivo | Status |
|------|---------|--------|
| L031 | [L031_ETAPA_01_EXECUCAO.md](./lotes/L031_ETAPA_01_EXECUCAO.md) | ✅ Fechado |
| L032 | [L032_ETAPA_01_EXECUCAO.md](./lotes/L032_ETAPA_01_EXECUCAO.md) | ✅ Fechado |
| L033 | [L033_ETAPA_04_SINTESE.md](./lotes/L033_ETAPA_04_SINTESE.md) | ✅ Fechado |
| L034 | [L034_ETAPA_01_EXECUCAO.md](./lotes/L034_ETAPA_01_EXECUCAO.md) | ✅ Fechado |
| L036-A | [L036-A_ETAPA_01_EXECUCAO.md](./lotes/L036-A_ETAPA_01_EXECUCAO.md) | ✅ Concluído |


---

## 🧩 Estrutura de Pastas

```text
docs/
├── index.md
├── changelog.md
├── visao-geral.md
├── setup-banco.md
├── auditoria-tecnica.md
├── playbook-operacional.md
├── agents/
│   ├── 00_abertura_operador.md … 11_*
├── patches/
│   ├── 020_product_components.md
│   ├── L033.md
│   ├── 040_rep_commissions_indexes.md
│   └── 050_representative_role.md
    └── L037_responsividade.md
└── lotes/
    ├── README.md
    ├── L031_* … L033_*
    ├── L034_ETAPA_01_EXECUCAO.md
    ├── L036-A_ETAPA_01_EXECUCAO.md
    ├── L036-A_ETAPA_03_AUDITORIA.md
    └── L036-A_TESTES_E_VALIDACAO.md
```

---

## 🔗 Acesso rápido

| Página | Descrição |
|--------|-----------|
| [Setup do banco](./setup-banco.md) | Passo a passo de preparação da base |
| [Changelog](./changelog.md) | Histórico resumido e organizado |
| [Auditoria técnica](./auditoria-tecnica.md) | Diagnóstico e visão de estabilidade |
| [Playbook operacional](./playbook-operacional.md) | Guia de operações diárias |
| [L037 — Responsividade mobile](./patches/L037_responsividade.md) | Patch de responsividade do dashboard e mapa |

