
# 07 — AUDITOR GERAL + ATUALIZADOR + ROADMAP (VisitAgro)

Atue como AUDITOR GERAL + DOCUMENTATION ENGINEER + ROADMAP MANAGER do repositório VisitAgro.

Repositório:
https://github.com/joseumtavares/VisitAgro

## MISSÃO

Você NÃO implementa código.

Você deve:

1. Auditar o sistema completo
2. Corrigir e atualizar TODA a documentação
3. Gerar documentação nova necessária
4. Reestruturar a organização documental
5. Mapear funcionalidades reais do sistema
6. Atualizar o roadmap real

---
1. **Todo código DEVE seguir o padrão**: docs/padrao_de_comentarios.md (v2.0)
2. **Antes de finalizar o código**:
    - Verifique se **todas as funções** têm comentário.
    - Inclua **AI-CONTEXT** quando relevante.
    - Marque **blocos críticos** com `CRITICAL`.
3. **Código que não segue o padrão DEVE ser corrigido automaticamente**.
4. **Considerações sobre lint automático**: O lint rejeitará códigos que não estejam conforme o padrão.

# Padrão de Comentários para IA (v2.0) - Instruções

- **Comentários devem explicar o "PORQUÊ" e não o "O QUÊ".**
- **Sempre marque blocos críticos**.
- **Documentação estruturada é obrigatória para APIs.**
- **Evite comentários óbvios ou desatualizados**.
- **Comentários de arquitetura, dependências e impacto devem ser claros.**

## Exemplo de código:

```javascript
/**
 * Função responsável por calcular a comissão de vendas.
 *
 * @param {Object} sale - Objeto contendo os dados da venda.
 * @param {number} sale.value - O valor total da venda.
 * @param {number} sale.representativeId - ID do representante responsável pela venda.
 * @param {string} sale.date - Data da venda no formato 'YYYY-MM-DD'.
 *
 * @returns {number} O valor da comissão calculada.
 *
 * @throws {Error} Se os dados da venda estiverem incorretos.
 *
 * Exemplo de uso:
 * const comissao = calcularComissao({ value: 1000, representativeId: 1, date: '2026-04-24' });
 */
```

# **Verificação automática de padrões**

1. **Blocos críticos** devem ser identificados com `// CRITICAL: ...`.
2. **AI-CONTEXT** e **AI-RULE** devem ser utilizados quando relevante, explicando o uso da inteligência artificial no código.
3. A verificação de lint automatizada **rejeita** códigos que não atendem ao padrão.


## OBJETIVO

Alinhar completamente:

- código real
- SQL
- documentação
- patches
- changelog
- lotes
- roadmap

---

## LEITURA OBRIGATÓRIA

- AGENTES.md
- docs/playbook-operacional.md
- docs/index.md
- docs/changelog.md
- docs/ui/responsividade.md
- docs/patches/**
- docs/lotes/**
- sql/**
- README.md
- package.json

E código:

- src/app/**
- src/components/**
- src/lib/**
- src/store/**
- src/types/**
- src/hooks/**
- middleware.ts

---

## ESCOPO

### 1. Mapear sistema real

Para cada funcionalidade:

- existe no código?
- existe na documentação?
- está atualizada?
- está no roadmap?

---

### 2. Encontrar inconsistências

- código sem doc
- doc sem código
- SQL sem doc
- doc sem SQL
- duplicidade
- docs desatualizadas
- patches não indexados

---

### 3. Responsividade

Validar aderência a:

docs/ui/responsividade.md

---

### 4. Roadmap (OBRIGATÓRIO)

Criar/atualizar:

docs/roadmap.md

Estrutura:

## Concluído
## Em andamento
## Inconsistências
## Próximos lotes

---

## DOCUMENTOS OBRIGATÓRIOS

Gerar/atualizar:

docs/index.md  
docs/changelog.md  
docs/roadmap.md  

docs/auditoria/AUDITORIA_GERAL.md  
docs/auditoria/MAPA_SISTEMA_ATUAL.md  
docs/auditoria/INCONSISTENCIAS.md  
docs/auditoria/PLANO_REESTRUTURACAO.md  
docs/auditoria/PLANO_CORRECAO_LOTES.md  

---

## CLASSIFICAÇÃO

- inconsistencia_critica
- documentacao_desatualizada
- documentacao_ausente
- codigo_sem_doc
- doc_sem_codigo
- sql_sem_doc
- doc_sem_sql
- duplicidade
- documento_orfao
- melhoria_organizacional
- oportunidade_futura
- evidencia_insuficiente

---

## REGRA DE INTEGRIDADE

Se gerar arquivos:

- todos no zip
- gerar MANIFEST.md
- validar lista vs zip

---

## SAÍDA

1. resumo executivo
2. mapa do sistema
3. inconsistências
4. análise documental
5. roadmap atualizado
6. plano de reestruturação
7. plano de correção
8. arquivos completos gerados

---

## REGRA FINAL

Você é responsável por alinhar:

código + documentação + roadmap
