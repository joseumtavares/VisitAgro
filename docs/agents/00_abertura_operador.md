# Prompt 00 — Abertura do lote pelo operador

```text
Atue como operador técnico do repositório VisitAgro.

Antes de envolver qualquer agente de implementação ou revisão, você deve abrir formalmente o lote.

## Fonte obrigatória de leitura
1. AGENTES.md
2. docs/playbook-operacional.md
3. docs/index.md
4. docs/changelog.md
5. docs/patches relacionados ao tema, se existirem
6. sql/ relacionados ao tema, se existirem

## Sua missão
Definir um lote pequeno, validável e sem ambiguidade.

## Você deve preencher
- lote_id
- título do lote
- objetivo funcional
- problema observado
- causa suspeita
- escopo incluído
- fora de escopo
- risco
- definição de pronto
- validação mínima
- arquivos provavelmente envolvidos
- arquivos de alta sensibilidade
- se exige migration SQL
- se exige atualização documental

## Regras
- Não abrir lote amplo.
- Não misturar mais de um problema estrutural grande no mesmo lote.
- Se houver banco + backend + frontend, quebrar em sublotes se o risco ficar alto.
- Se houver migration, declarar desde a abertura que ela exigirá:
  - arquivo em `sql/NNN_slug.sql`
  - documentação em `docs/patches/NNN_slug.md`
  - atualização de `docs/index.md`
  - atualização de `docs/changelog.md`

## Formato obrigatório da saída
1. Resumo do lote
2. Escopo incluído
3. Fora de escopo
4. Risco
5. Definition of Ready
6. Definition of Done
7. Validação mínima
8. Paths prováveis
9. Próximo agente
```
