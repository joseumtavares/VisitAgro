# L032_Adicao_Busca_MapaCad_Cliente — Registro mestre do lote

## 1. Identificação
- lote_id: L032_Adicao_Busca_MapaCad_Cliente
- título: Adição de seleção de localização no mapa ao cadastro de clientes
- objetivo funcional: Permitir que o usuário abra o mapa picker diretamente no modal de cadastro/edição de clientes, selecione ou ajuste a localização com GPS ou clique, e retorne lat/lng/maps_link ao formulário com card visual de confirmação
- tipo: feature
- prioridade: média
- status atual: implementado
- data de abertura: 2026-04-18

## 2. Escopo aprovado
- escopo incluído:
  - botão "Selecionar localização no mapa" na seção de localização do cadastro de clientes
  - integração com GpsPickerMap.tsx existente (sem criar novo componente de mapa)
  - card visual de localização confirmada com coordenadas
  - botão "Abrir no Maps" (link externo)
  - botão "Copiar" coordenadas para clipboard
  - botão "Editar localização" (reabre o mapa)
  - preservação integral de: busca por CEP, busca Nominatim, campos manuais de lat/lng/maps_link
  - carregamento correto ao editar cliente com localização existente

- fora de escopo:
  - alteração de schema do banco (campos lat/lng/maps_link já existem)
  - criação de nova rota de API
  - alteração de outros módulos do sistema
  - mini mapa estático no card (descartado: custo alto, GpsPickerMap já supre a necessidade)

- critérios de pronto:
  - botão abre GpsPickerMap fullscreen
  - confirmar localização preenche lat/lng/maps_link no form
  - card aparece quando há coordenadas
  - todos os fluxos anteriores de localização continuam funcionando
  - npm run build sem erros

## 3. Contexto técnico
- módulos envolvidos: cadastro de clientes
- rotas: nenhuma nova — /api/clients/route.ts e [id]/route.ts já persistem lat/lng/maps_link
- páginas/componentes: src/app/dashboard/clients/page.tsx (alterado)
- componentes reutilizados: src/components/map/GpsPickerMap.tsx (sem alteração), src/components/map/LeafletProvider.tsx (sem alteração)

## 4. Arquivos tocados no lote

| arquivo | tipo de mudança | risco |
|---------|----------------|-------|
| src/app/dashboard/clients/page.tsx | substituição com adições | médio — arquivo principal do módulo |

## 5. Arquivos protegidos (sem alteração)
- src/components/map/GpsPickerMap.tsx
- src/components/map/LeafletProvider.tsx
- src/app/api/clients/route.ts
- src/app/api/clients/[id]/route.ts
- src/lib/supabaseAdmin.ts
- middleware.ts

## 6. Patches SQL do lote
Nenhum — os campos lat, lng e maps_link já existem na tabela clients no schema atual.

## 7. Riscos remanescentes
- dynamic import do GpsPickerMap com ssr:false — já é o padrão do projeto para componentes Leaflet; comportamento idêntico ao usado em /dashboard/map

## 8. Critério de encerramento
- [x] botão abre mapa picker
- [x] mapa usa GpsPickerMap existente sem recriar lógica
- [x] confirmar preenche lat/lng/maps_link
- [x] card aparece com coordenadas, botões Maps/Copiar/Editar
- [x] CEP continua funcionando
- [x] Nominatim continua funcionando
- [x] edição de cliente existente carrega localização corretamente
- [x] sem alteração de schema/API