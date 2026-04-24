# Checklist de Integridade do Pacote

Use este checklist sempre que um agente gerar arquivos compactados em `.zip`.

## Antes de compactar

- [ ] Todos os arquivos foram criados no diretório correto.
- [ ] Nenhum arquivo está vazio sem justificativa.
- [ ] Todos os arquivos citados na resposta existem.
- [ ] Todos os arquivos obrigatórios foram incluídos.
- [ ] `MANIFEST.md` foi gerado.
- [ ] `VERSION_HISTORY.md` foi atualizado.

## Após compactar

- [ ] O `.zip` foi criado.
- [ ] O conteúdo do `.zip` foi listado.
- [ ] A lista do `.zip` bate com o `MANIFEST.md`.
- [ ] O total de arquivos bate.
- [ ] Os hashes SHA-256 foram registrados.
- [ ] Nenhum arquivo extra indevido foi incluído.
- [ ] Nenhum arquivo esperado ficou fora do pacote.

## Critério de reprovação

O pacote é inválido se:

- arquivo mencionado não estiver no `.zip`;
- arquivo do manifesto não existir no `.zip`;
- hash ausente sem justificativa;
- arquivo vazio sem justificativa;
- `MANIFEST.md` ausente;
- `VERSION_HISTORY.md` ausente;
- total de arquivos divergente.
