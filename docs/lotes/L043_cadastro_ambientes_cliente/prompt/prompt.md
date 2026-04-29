# Prompt — Agente 02 — Mapa de impacto técnico — L043

Você é o **Agente 02 — Mapa de impacto técnico** do repositório VisitAgro.

## Lote

- `lote_id`: L043
- `slug`: cadastro_ambientes_cliente
- `título`: Cadastro de ambientes vinculados ao cliente
- `estado`: aberto

## Regra principal

Nenhuma implementação nesta etapa. Seu papel é rastrear impacto real no repositório e confirmar se o lote está pronto para execução por sub-lotes.

## Leitura obrigatória, nesta ordem

1. `AGENTES.md`
2. `docs/playbook-operacional.md`
3. `docs/index.md`
4. `docs/changelog.md`
5. `docs/ui/responsividade.md`
6. `docs/padrao_de_comentarios.md`
7. `sql/schema_atual_supabase.sql`
8. `src/app/dashboard/clients/page.tsx`
9. `src/app/dashboard/sales/page.tsx`
10. `src/app/api/orders/route.ts`
11. `src/app/api/orders/[id]/route.ts`
12. `src/types/index.ts`
13. Procurar por qualquer arquivo existente contendo: `environment`, `environments`, `ambiente`, `talhao`, `talhão`, `drawing`.

## Objetivo do mapeamento

Confirmar como implementar, em sub-lotes seguros, o cadastro de ambientes do cliente e o vínculo opcional desses ambientes no pedido/venda.

## Questões que você deve responder

1. A tabela `public.environments` existe no schema real do repositório?
2. A tabela existe também no banco real/homologação, se você tiver acesso?
3. Já existe rota API para ambientes?
4. Já existe página ou componente de ambientes?
5. `orders.environment_id` já é usado em algum lugar?
6. O `POST /api/orders` aceita `environment_id` por espalhamento do payload? Se sim, falta validação de pertencimento?
7. Qual rota é mais consistente com o padrão atual?
   - `GET/POST /api/clients/[id]/environments`
   - `GET/PUT/DELETE /api/environments/[id]`
   - outra opção com justificativa.
8. É necessário migration SQL?
   - Não recriar tabela se ela já existir.
   - Declarar migration apenas para divergência real, índices, constraints ou campos de medida que não possam ir em `drawing jsonb`.
9. A dependência de desenho técnico deve ser evitada no sub-lote inicial?
   - Avaliar preview simples com SVG/Canvas nativo usando `drawing jsonb`.
   - Considerar `react-konva` apenas para sub-lote posterior, se houver interação complexa.

## Saída obrigatória

Responda com:

1. Resumo executivo.
2. Evidências encontradas com caminhos e trechos.
3. Arquivos diretos impactados.
4. Arquivos indiretos/sensíveis.
5. Proposta de sub-lotes, abrindo apenas o primeiro executável.
6. Migration: sim/não, com justificativa.
7. Contrato API proposto.
8. Contrato UI proposto.
9. Riscos priorizados.
10. Checklist de validação para o Agente 03/Claude.

## Guardrails

- Não implementar código.
- Não ampliar para relatórios.
- Não criar CAD completo.
- Não alterar autenticação, middleware, `apiFetch`, store global ou layout global sem necessidade comprovada.
- Usar anchors textuais, não só números de linha.
- Seguir `docs/padrao_de_comentarios.md` na recomendação de implementação futura.
