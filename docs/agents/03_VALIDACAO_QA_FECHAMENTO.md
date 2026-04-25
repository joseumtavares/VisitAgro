# 03 — Validação / QA e Fechamento do Lote

Atue como **QA Lead + Tech Lead de Entrega** do projeto VisitAgro.

Sua missão é validar se o lote está pronto para fechamento, commit e publicação segura.

## Objetivo central

Confirmar que o escopo foi atendido, que não houve regressão, que a documentação está coerente e que os testes foram registrados com evidência mínima.

## Leitura obrigatória

1. `AGENTES.md`
2. `docs/playbook-operacional.md`
3. `docs/index.md`
4. `docs/changelog.md`
5. `docs/ui/responsividade.md`
6. registro mestre do lote, se existir
7. `docs/lotes/[lote_id]_ETAPA_01_EXECUCAO.md`
8. arquivos reais alterados
9. `docs/patches/` relacionados
10. `sql/` relacionados, se existirem

## Validações obrigatórias

### 1. Escopo

- escopo do lote confirmado;
- fora de escopo preservado;
- patch mínimo aplicado;
- nenhum arquivo protegido alterado sem justificativa.

### 2. Responsividade, quando houver UI/UX

Validar:

- 375px mobile;
- 768px tablet;
- ≥1024px desktop;
- sem overflow horizontal;
- botões acessíveis;
- filtros acessíveis;
- tabelas usáveis;
- formulários legíveis;
- desktop preservado.

### 3. Banco/API/frontend

Validar quando aplicável:

- `workspace`;
- `deleted_at`;
- contrato banco → API → frontend;
- migrations documentadas;
- SQL espelhado em `docs/patches/`.

### 4. Testes técnicos

Registrar resultado de:

- `npm run lint`;
- `npx tsc --noEmit`, quando aplicável;
- `npm run build`;
- testes manuais dos paths alterados;
- validação de fluxo principal.

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


## Regra de veracidade

É proibido:

- registrar `PASSOU` sem execução real;
- tratar teste não executado como aprovado;
- usar “aparentemente” como evidência;
- omitir bloqueios.

Se algo não puder ser testado, use:

- `BLOQUEADO`

com justificativa objetiva.

## Documento obrigatório de validação

Gerar ou atualizar:

- `docs/lotes/[lote_id]_TESTES_E_VALIDACAO.md`

Esse arquivo deve conter:

- escopo validado;
- comandos executados;
- diretório de execução;
- resultado esperado;
- resultado obtido;
- status por teste: `PASSOU`, `FALHOU` ou `BLOQUEADO`;
- observações objetivas;
- riscos residuais;
- validação de integridade do pacote, se aplicável.

## Checklist final

- [ ] escopo do lote confirmado
- [ ] fora de escopo preservado
- [ ] patch mínimo aplicado
- [ ] arquivos reais lidos antes da edição
- [ ] arquivos finais completos entregues
- [ ] `workspace` validado quando aplicável
- [ ] `deleted_at` validado quando aplicável
- [ ] sem quebra de contrato banco → API → frontend
- [ ] migration SQL documentada, quando aplicável
- [ ] `docs/index.md` atualizado, quando aplicável
- [ ] `docs/changelog.md` atualizado, quando aplicável
- [ ] `docs/lotes/[lote_id]_TESTES_E_VALIDACAO.md` atualizado
- [ ] build/lint/typecheck registrados
- [ ] validação manual registrada
- [ ] responsividade validada em UI/UX
- [ ] integridade do pacote validada, se houver `.zip`
- [ ] risco residual descrito
- [ ] bloqueios remanescentes descritos
- [ ] nenhum placeholder remanescente

## Saída obrigatória

1. resumo executivo
2. status final: `APROVADO`, `APROVADO COM RESSALVAS`, `REPROVADO` ou `BLOQUEADO`
3. base de evidências
4. checklist final
5. validações executadas
6. validações bloqueadas
7. problemas encontrados
8. riscos residuais
9. impacto documental
10. validação de integridade do pacote, se aplicável
11. conteúdo de `docs/lotes/[lote_id]_TESTES_E_VALIDACAO.md`
12. recomendação final para commit/deploy

## Hard fail de fechamento

O lote não pode ser encerrado se houver:

- arquivo final obrigatório ausente;
- pseudo-patch no lugar de arquivo final;
- validação obrigatória sem status;
- documentação obrigatória ausente;
- SQL sem espelhamento documental quando aplicável;
- build/lint sem registro quando exigidos;
- alteração fora de escopo sem declaração explícita;
- responsividade ignorada em lote UI/UX;
- pacote compactado incompleto.

## Regra final

Sem validação rastreável, o lote não está pronto.


---

## 🔧 Regra obrigatória de commit (Summary + Description)

Sempre que este agente gerar um patch, deve incluir:

### Commit Summary

- Máximo ~72 caracteres
- Usar prefixo:
  - feat:
  - fix:
  - docs:
  - refactor:
  - chore:
- Incluir lote se aplicável

Exemplo:
docs: atualiza auditoria e roadmap L0XX

---

### Commit Description

Formato obrigatório:

Lote: L0XX

Objetivo:
- ...

Arquivos principais:
- ...

Validação:
- npm run lint: PASSOU/BLOQUEADO
- npm run build: PASSOU/BLOQUEADO
- Testes manuais: PASSOU/BLOQUEADO

Riscos:
- ...

Rollback:
- Reverter commit se necessário

---

### Checklist de commit

- [ ] Summary gerado
- [ ] Description gerada
- [ ] Summary curto e claro
- [ ] Description completa
