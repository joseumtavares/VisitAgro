# L043 — ETAPA_00 — Registro formal do lote

## 4.1 Cabeçalho do lote

```text
lote_id          : L043
slug             : cadastro_ambientes_cliente
título           : Cadastro de ambientes vinculados ao cliente
estado           : aberto
origem           : solicitação humana
próximo agente   : Agente 02 — Mapa de impacto técnico
```

## 4.2 Contexto

- **Problema observado:** o VisitAgro possui clientes produtores com múltiplos ambientes físicos, como estufas de fumo com medidas diferentes, mas o cadastro de clientes ainda não expõe uma página/fluxo para cadastrar, listar, editar e desativar esses ambientes. Também não há seleção visível de ambiente no fluxo de venda, embora o banco já tenha vínculo técnico disponível.
- **Causa suspeita:** a base de dados já contém `public.environments` e `orders.environment_id`, porém a funcionalidade aparece como pendente na documentação/roadmap e não está integrada de forma operacional ao CRUD de clientes nem à tela de vendas. A implementação futura deve validar se existem rotas reais para ambientes antes de criar novas.
- **Impacto:** a empresa não consegue rastrear em qual estufa, talhão ou ambiente foram instalados produtos como fornalha, porta, ventilador ou alimentador de cavaco. Isso degrada histórico técnico do cliente, pós-venda, manutenção e relatórios por ambiente.
- **Base documental usada:**
  - `AGENTES.md`: confirma Next.js 14/App Router, rotas em `src/app/api/**/route.ts`, Supabase via `getAdmin()`, tenancy por `x-workspace`, necessidade de filtros explícitos e arquivos sensíveis.
  - `docs/playbook-operacional.md`: exige lote pequeno, evidência real, patch mínimo, DoR/DoD, validação com `npm run lint` e `npm run build`.
  - `docs/index.md`: centraliza documentação, controle de lotes, patches e convenção de atualização documental.
  - `docs/changelog.md`: registra L038 mobile-first e mantém “ambientes e talhões” como item planejado/pendente.
  - `docs/ui/responsividade.md`: obrigatório para UI; exige mobile-first, 375px/768px/≥1024px, sem overflow horizontal, formulários em coluna única no mobile e botões com toque mínimo.
  - `docs/padrao_de_comentarios.md`: implementação futura deve seguir o padrão de comentários v3.0 com `CRITICAL`, `AI-CONTEXT`, `AI-CONTRACT` e `AI-RULE` quando houver regra de negócio, service role, workspace, contratos ou efeitos colaterais.
  - `sql/schema_atual_supabase.sql`: já contém `public.environments` com `workspace`, `client_id`, `name`, `area`, `area_unit`, `obs`, `lat`, `lng`, `drawing`, `active`, timestamps e FK para `clients`; também contém `orders.environment_id` com FK para `environments`.
  - `src/app/dashboard/clients/page.tsx`: CRUD de clientes existe e usa modal responsivo, GPS/map picker e `apiFetch('/api/clients')`.
  - `src/app/dashboard/sales/page.tsx`: tela de vendas carrega pedidos, clientes, produtos, indicadores e representantes, mas não carrega/lista ambientes nem envia `environment_id` no formulário atual.
  - `package.json`: não há dependência instalada para desenho técnico/canvas de ambiente, como `konva`, `react-konva` ou `fabric`.
  - `src/components/map/GpsPickerMap.tsx`: componente existente resolve localização GPS/mapa, não desenho técnico por medidas.

## 4.3 Escopo

**Incluído:**

- Abrir o lote como **L043 — Cadastro de ambientes vinculados ao cliente**, com execução futura dividida por sub-lotes para evitar mistura de banco + API + UI + vendas em uma única alteração grande.
- Confirmar no próximo agente se `public.environments` existe no banco de produção com os campos do schema atual.
- Definir que a implementação futura deve reaproveitar a tabela `environments` existente, sem recriar schema inteiro.
- Definir CRUD operacional de ambientes vinculado ao cliente:
  - listar ambientes de um cliente;
  - criar ambiente com nome, tipo/categoria opcional, medidas/área, unidade, observações, localização opcional e desenho/preview opcional em `drawing`;
  - editar ambiente;
  - desativar ambiente via `active = false`, evitando delete físico;
  - filtrar sempre por `workspace` e `client_id`.
- Definir ponto de entrada no cadastro de clientes:
  - botão/ação “Ambientes” em cada cliente;
  - página sugerida: `src/app/dashboard/clients/[id]/environments/page.tsx`.
- Definir rotas prováveis:
  - `GET/POST /api/clients/[id]/environments`;
  - `GET/PUT/DELETE /api/environments/[id]` ou alternativa validada pelo Agente 02 conforme padrão real do repo.
- Definir integração futura com vendas:
  - selecionar ambiente após selecionar cliente;
  - enviar `environment_id` apenas quando houver ambiente selecionado;
  - validar no backend que o ambiente pertence ao mesmo `client_id` e `workspace` do pedido.
- Registrar pesquisa preliminar de desenho técnico:
  - não foi identificada dependência instalada no projeto para desenho técnico por medidas;
  - `environments.drawing jsonb` já permite armazenar estrutura geométrica;
  - opção recomendada para sub-lote posterior: começar com preview SVG/Canvas simples baseado em medidas; avaliar `react-konva` somente se a interação exigir arrastar/redimensionar elementos.
- Preparar documentação futura obrigatória:
  - `docs/patches/L043_cadastro_ambientes_cliente.md`;
  - atualização de `docs/index.md`;
  - atualização de `docs/changelog.md`.

**Excluído explicitamente:**

- Não implementar código nesta etapa.
- Não recriar a tabela `environments` do zero sem confirmação de ausência no banco real.
- Não alterar `orders` em profundidade além do vínculo controlado com `environment_id` em sub-lote futuro.
- Não implementar CAD completo, planta baixa avançada, cálculo estrutural, exportação DWG/DXF ou desenho técnico profissional nesta abertura.
- Não alterar autenticação, middleware, `apiFetch`, store global ou layout global sem justificativa do Agente 02.
- Não alterar relatórios neste lote; relatórios por ambiente devem ser lote posterior.
- Não misturar ambientes com talhões agrícolas avançados, mapas geográficos ou polígonos georreferenciados; o foco inicial é ambiente técnico do cliente.
- Não incluir upload de fotos/documentos do ambiente nesta etapa.

## 4.4 Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---:|---:|---|
| Tabela `environments` existir no schema, mas não estar aplicada no banco de produção | média | alto | Agente 02 deve validar Supabase/schema real antes de qualquer UI; se ausente, declarar migration idempotente antes da API. |
| Misturar CRUD de ambiente com venda e desenho técnico em um único patch | alta | alto | Dividir em sub-lotes: cadastro/API, UI do cliente, vínculo na venda, desenho/preview. |
| `getAdmin()` ignorar RLS e vazar ambientes entre workspaces | média | alto | Toda query deve usar `.eq('workspace', workspace)` e validar `client_id`; usar comentários `CRITICAL`/`AI-RULE`. |
| Delete físico apagar histórico técnico usado por pedidos | média | alto | Usar `active = false` como desativação; impedir exclusão se ambiente já estiver vinculado a pedido, salvo regra explícita. |
| UI quebrar mobile no cadastro de clientes | média | médio | Seguir `docs/ui/responsividade.md`; testar 375px, 768px e ≥1024px; usar cards/formulário coluna única. |
| Desenho técnico virar dependência pesada e atrasar a entrega principal | média | médio | Manter desenho avançado fora do sub-lote inicial; começar por dados/preview simples em `drawing jsonb`. |
| Seleção de ambiente em venda permitir ambiente de outro cliente | média | alto | Backend deve validar ambiente por `id`, `client_id`, `workspace` e `active = true` antes do insert/update de pedido. |

## 4.5 Definition of Ready

O lote só pode entrar em execução se:

- [ ] Base documental confirmada.
- [ ] Escopo revisado e sem ambiguidade.
- [ ] Arquivos sensíveis identificados.
- [ ] Migration SQL declarada, se o banco real divergir do schema documentado.
- [ ] Responsividade verificada para a página de ambientes e para qualquer alteração no cadastro de clientes.
- [ ] Agente 02 confirmar se já existem rotas, componentes ou páginas de `environments` no código real.
- [ ] Agente 02 confirmar se `public.environments` está aplicado no Supabase de produção/homologação.
- [ ] Contrato mínimo de `Environment` definido antes da UI.
- [ ] Estratégia de desativação definida: `active = false`, sem delete físico por padrão.
- [ ] Estratégia do desenho técnico definida como preview simples ou sub-lote posterior.

## 4.6 Definition of Done

O lote está concluído quando:

- [ ] Todos os itens do escopo aprovado do sub-lote em execução estão implementados.
- [ ] Validação mínima aprovada.
- [ ] Sem regressão nos pontos declarados.
- [ ] Documentação atualizada em `docs/patches`, `docs/index.md` e `docs/changelog.md`.
- [ ] Ambientes podem ser cadastrados, listados, editados e desativados para um cliente específico.
- [ ] Nenhuma listagem de ambientes retorna dados de outro `workspace`.
- [ ] Ambientes inativos não aparecem como opção operacional, salvo se houver filtro explícito.
- [ ] Venda permite selecionar ambiente apenas do cliente escolhido, se o sub-lote de vendas for executado.
- [ ] Backend rejeita `environment_id` inexistente, inativo, de outro cliente ou de outro workspace.
- [ ] UI validada em 375px, 768px e ≥1024px sem overflow horizontal.
- [ ] `npm run lint` e `npm run build` executados ou exceção documentada.

## 4.7 Validação mínima

- **Contexto de entrada:** usuário admin/manager autenticado acessa `/dashboard/clients` com pelo menos um cliente existente.  
  **Ação:** clicar em “Ambientes” no cliente.  
  **Resultado esperado:** abre página/fluxo de ambientes do cliente correto, sem redirecionar indevidamente e sem erro de autenticação.

- **Contexto de entrada:** cliente sem ambientes cadastrados.  
  **Ação:** abrir a página de ambientes desse cliente.  
  **Resultado esperado:** exibir estado vazio com CTA “Novo ambiente” e sem tabela larga no mobile.

- **Contexto de entrada:** formulário de novo ambiente com nome vazio.  
  **Ação:** tentar salvar.  
  **Resultado esperado:** UI/backend impedem gravação e retornam mensagem “Nome do ambiente obrigatório” ou equivalente.

- **Contexto de entrada:** formulário com nome “Estufa 01”, área/medidas preenchidas, observação e desenho/preview simples opcional.  
  **Ação:** salvar ambiente.  
  **Resultado esperado:** registro criado em `environments` com `workspace`, `client_id`, `active = true` e timestamps; lista atualiza sem recarregar a sessão.

- **Contexto de entrada:** ambiente ativo existente.  
  **Ação:** editar nome, área/medidas e observação.  
  **Resultado esperado:** alterações persistem e `updated_at` é atualizado.

- **Contexto de entrada:** ambiente ativo não vinculado a pedido.  
  **Ação:** remover/desativar pela UI.  
  **Resultado esperado:** registro não é apagado fisicamente; fica `active = false` e some da listagem operacional.

- **Contexto de entrada:** request para listar ambientes de cliente A usando `workspace` principal.  
  **Ação:** tentar obter ambiente de cliente B ou workspace diferente.  
  **Resultado esperado:** API retorna lista vazia ou 404/403, sem vazamento de dados.

- **Contexto de entrada:** venda nova com cliente selecionado e ambientes ativos cadastrados para esse cliente.  
  **Ação:** escolher um ambiente e salvar venda.  
  **Resultado esperado:** pedido salvo com `environment_id` correto, mantendo regras já existentes de cliente obrigatório, representante obrigatório e indicador opcional.

- **Contexto de entrada:** venda nova com `environment_id` de outro cliente enviado manualmente no payload.  
  **Ação:** enviar POST para `/api/orders`.  
  **Resultado esperado:** backend rejeita com 400/403 e não cria pedido inconsistente.

- **Contexto de entrada:** tela em 375px.  
  **Ação:** abrir lista e formulário de ambientes.  
  **Resultado esperado:** sem overflow horizontal; formulário em coluna única; botões com área mínima de toque; ações acessíveis.

- **Contexto de entrada:** tela em 768px e ≥1024px.  
  **Ação:** abrir lista e formulário de ambientes.  
  **Resultado esperado:** layout intermediário coerente e desktop preservado.

## 4.8 Arquivos envolvidos

**Prováveis:**

```text
src/app/dashboard/clients/page.tsx
src/app/dashboard/clients/[id]/environments/page.tsx
src/app/api/clients/[id]/environments/route.ts
src/app/api/environments/[id]/route.ts
src/app/dashboard/sales/page.tsx
src/app/api/orders/route.ts
src/app/api/orders/[id]/route.ts
src/components/environments/EnvironmentForm.tsx
src/components/environments/EnvironmentDrawingPreview.tsx
src/types/index.ts
sql/060_cadastro_ambientes_cliente.sql
docs/patches/L043_cadastro_ambientes_cliente.md
docs/index.md
docs/changelog.md
```

**Alta sensibilidade** (alterar pode causar regressão ampla):

```text
src/types/index.ts
src/app/api/orders/route.ts
src/app/api/orders/[id]/route.ts
src/app/dashboard/sales/page.tsx
src/app/dashboard/clients/page.tsx
```

## 4.9 Dependências

- **Migration SQL exigida:** sim — não para recriar a tabela se ela já existir; sim como migration idempotente/condicional caso o Agente 02 confirme ausência no banco real, ausência de índices mínimos ou necessidade de campos explícitos para medidas. Caminho sugerido: `sql/060_cadastro_ambientes_cliente.sql`.
- **Atualização documental exigida:** sim — `docs/patches/L043_cadastro_ambientes_cliente.md`, `docs/index.md`, `docs/changelog.md`.
- **Documentação prévia pendente:** não bloqueia a abertura, mas o Agente 02 deve registrar evidência de:
  - presença/ausência de rotas reais de ambientes;
  - presença/ausência de campos da tabela `environments` no Supabase real;
  - decisão técnica sobre desenho simples versus lib externa.

## 4.10 Critérios de reprovação da abertura

Esta abertura é inválida se qualquer item abaixo for verdadeiro:

- [ ] Escopo amplo ou dependente de interpretação livre.
- [ ] Base documental não explicitada.
- [ ] Lote aberto sobre ideia não formalizada.
- [ ] “Fora de escopo” ausente ou vago.
- [ ] Validação mínima genérica demais.
- [ ] Arquivos sensíveis não destacados quando relevantes.
- [ ] Lote mistura mais de um problema estrutural grande.
- [ ] Frontend sem verificação de `docs/ui/responsividade.md`.
- [ ] Conflito documental encontrado e não registrado.

## 5. Arquivos gerados

```text
/L043_cadastro_ambientes_cliente/
├── docs/lote/
│   └── L043_cadastro_ambientes_cliente_ETAPA_00_REGISTRO_LOTE.md
├── metadata/
│   └── lote.json
├── checklist/
│   └── validacao.md
└── prompt/
    └── prompt.md
```
