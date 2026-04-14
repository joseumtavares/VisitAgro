# Auditoria Técnica

[Central da documentação](./index.md) · [Release 0.9.4](./updates-v094.md) · [Setup do banco](./setup-banco.md)

---

## Contexto

A auditoria técnica comparou o schema real do banco com o código TypeScript do projeto para identificar incompatibilidades, falhas de segurança e riscos operacionais.

## Diagnóstico executivo

A análise encontrou um conjunto de problemas com diferentes níveis de severidade, com maior impacto na instalação limpa do sistema, autenticação e alinhamento de tipos.

## Principal achado

O ponto mais crítico foi a dependência da tabela `workspaces`.

Sem a row `principal` previamente criada, os inserts do sistema podem falhar em cascata, deixando uma instalação nova inoperante.

## Grupos de risco identificados

### 1. Banco e schema

- dependências obrigatórias não atendidas em instalação limpa
- campos com comportamento diferente do esperado pelo código
- alinhamento parcial entre schema e tipos públicos

### 2. Autenticação e autorização

- fluxo de login precisava de endurecimento
- acesso administrativo exigia restrição mais forte
- alguns filtros precisavam considerar corretamente o workspace

### 3. Robustez do frontend

- alguns fluxos silenciosos escondiam erro real
- chamadas HTTP precisavam validar melhor respostas e payloads

## O que a auditoria gerou de valor

A auditoria serviu como base para a release `0.9.4`, ajudando a transformar observações técnicas em correções concretas.

## Como manter esse material organizado

O arquivo original da auditoria pode continuar existindo como registro completo, mas a página pública ideal é esta versão resumida e orientada à leitura.

## Sugestão de uso no repositório

- esta página fica na navegação principal da documentação
- o arquivo técnico completo pode ser mantido como referência detalhada
- futuras auditorias podem ganhar páginas irmãs, por exemplo:
  - `auditoria-v1.md`
  - `auditoria-seguranca.md`
  - `auditoria-performance.md`
