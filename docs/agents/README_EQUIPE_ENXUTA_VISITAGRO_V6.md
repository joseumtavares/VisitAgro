# Equipe Enxuta de Prompts — VisitAgro V6

Data: 2026-04-24

Este pacote organiza os prompts do VisitAgro como uma equipe profissional enxuta.

## Fluxo principal

```text
01 PLANEJAMENTO → 02 ENGENHARIA → 03 VALIDAÇÃO
```

## Fluxos auxiliares

```text
DEBUG → 04 Comentador Técnico ou 05 Orquestrador Automático
INCIDENTE → 06 Incidente de Deploy/Build/Runtime
```

## Arquivos principais

1. `01_PLANEJAMENTO_ABERTURA_LOTE.md`
2. `02_ENGENHARIA_EXECUTOR_COMPLETO.md`
3. `03_VALIDACAO_QA_FECHAMENTO.md`
4. `04_DEBUG_COMENTADOR_TECNICO.md`
5. `05_DEBUG_ORQUESTRADOR_AUTOMATICO.md`
6. `06_INCIDENTE_DEPLOY.md`
7. `07_GUIA_DE_USO_LEIGO.md`

## Arquivos de controle

- `MANIFEST.md`
- `VERSION_HISTORY.md`
- `CHECKLIST_INTEGRIDADE_PACOTE.md`

## O que foi removido do fluxo principal

- auditor de comentários separado;
- consolidador de comentários separado;
- múltiplos handoffs obrigatórios;
- excesso de templates;
- fluxo de 4 etapas para todo caso;
- duplicação entre executor, revisor e auditor.


## Regra crítica de integridade do pacote final

Toda entrega que gere arquivos deve garantir que TODOS os arquivos produzidos estejam presentes no pacote final compactado `.zip`.

É proibido:

- listar arquivos sem incluí-los no pacote;
- mencionar arquivos que não foram gerados;
- gerar arquivos fora do pacote final;
- omitir arquivos técnicos, SQL ou documentação;
- entregar arquivo vazio sem justificativa objetiva.

## Checklist obrigatório antes de compactar

Para cada arquivo mencionado na resposta:

- [ ] o arquivo foi realmente gerado;
- [ ] o conteúdo está completo;
- [ ] o path está correto;
- [ ] o arquivo foi incluído no pacote `.zip`;
- [ ] o arquivo aparece no `MANIFEST.md`;
- [ ] o hash SHA-256 foi registrado quando aplicável.

## Regra de validação cruzada

O agente deve:

1. listar todos os arquivos gerados;
2. comparar com os arquivos incluídos no `.zip`;
3. validar que não há divergência entre:
   - lista declarada;
   - arquivos reais;
   - manifesto;
   - pacote compactado.

Se houver divergência:

- classificar como `ERRO_CRITICO`;
- corrigir antes de entregar;
- não declarar pacote pronto.

## Regra de falha

A entrega é inválida se:

- qualquer arquivo estiver faltando;
- qualquer arquivo estiver vazio sem justificativa;
- qualquer arquivo estiver citado mas não incluído;
- qualquer arquivo estiver com path incorreto;
- o `MANIFEST.md` não refletir o pacote real;
- o histórico de versão não for atualizado em nova versão.


## Regra de uso

Se não souber por onde começar, use sempre:

```text
01_PLANEJAMENTO_ABERTURA_LOTE.md
```
