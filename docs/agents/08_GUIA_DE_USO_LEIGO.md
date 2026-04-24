# 07 — Guia de Uso para Leigos

Este guia explica como usar a equipe enxuta de prompts do VisitAgro sem conhecimento técnico avançado.

## Fluxo principal

Use sempre esta ordem:

```text
01_PLANEJAMENTO_ABERTURA_LOTE.md
↓
02_ENGENHARIA_EXECUTOR_COMPLETO.md
↓
03_VALIDACAO_QA_FECHAMENTO.md
```

## Quando usar cada prompt

### 1. Planejamento

Use quando você tem uma ideia, problema ou melhoria.

Exemplos:

```text
Quero melhorar a tela de clientes no celular.
```

```text
O botão de criar lead está difícil de usar no mobile.
```

```text
Preciso criar uma nova página de cadastro de ambiente.
```

O resultado será um lote claro, pequeno e seguro.

### 2. Engenharia

Use depois que o lote foi aberto.

Esse prompt implementa o patch e já faz uma revisão técnica interna.

Ele deve receber:

- o lote aberto;
- o objetivo;
- os arquivos prováveis;
- as regras de validação.

### 3. Validação

Use depois da engenharia.

Esse prompt verifica se:

- o que foi pedido foi feito;
- o mobile está bom;
- o desktop não quebrou;
- build/lint foram registrados;
- a documentação foi atualizada;
- o pacote final está íntegro, quando houver `.zip`.

## Fluxo de debug

Use quando o objetivo for facilitar investigação futura no código.

### Opção simples

Use:

```text
04_DEBUG_COMENTADOR_TECNICO.md
```

Exemplo:

```text
Comente os pontos críticos do módulo de vendas para facilitar debugging.
```

### Opção automática

Use:

```text
05_DEBUG_ORQUESTRADOR_AUTOMATICO.md
```

Exemplo:

```text
Execute o fluxo automático de debugging no módulo de representantes.
```

## Fluxo de incidente

Use somente quando houver erro de deploy, build ou produção.

Prompt:

```text
06_INCIDENTE_DEPLOY.md
```

Exemplos:

```text
O deploy na Vercel falhou com erro de TypeScript.
```

```text
Após o patch, a tela quebra em produção, mas funciona localmente.
```

```text
A aplicação publicou, mas a API retorna erro 500.
```

## Como escolher o caminho correto

| Situação | Prompt |
|---|---|
| Ideia nova | 01 Planejamento |
| Nova implementação | 01 → 02 → 03 |
| Correção de bug | 01 → 02 → 03 |
| Ajuste mobile/UX | 01 → 02 → 03 |
| Comentários para debugging | 04 |
| Debug automático por módulo | 05 |
| Erro de deploy/build/runtime | 06 |

## Regra de ouro

Se você não sabe por onde começar, use:

```text
01_PLANEJAMENTO_ABERTURA_LOTE.md
```

## Regra do pacote compactado

Quando houver entrega em `.zip`, confira:

1. existe `MANIFEST.md`;
2. existe `VERSION_HISTORY.md`;
3. todos os arquivos listados no manifesto estão no zip;
4. o total de arquivos bate;
5. nenhum arquivo está vazio.

## O que não fazer

- Não usar todos os prompts para qualquer problema.
- Não usar debug quando quer implementar feature.
- Não usar incidente quando é apenas melhoria.
- Não pedir “melhore tudo”.
- Não aprovar lote sem validação.
- Não aceitar pacote sem manifesto.

## Padrão profissional adotado

Esta equipe simula uma equipe real:

- Planejamento = Product Manager + Operador técnico
- Engenharia = Dev sênior + revisor + auditor
- Validação = QA Lead + Tech Lead
- Debug = especialista de manutenção
- Incidente = especialista de produção
