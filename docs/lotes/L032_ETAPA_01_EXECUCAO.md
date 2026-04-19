# L032_Adicao_Busca_MapaCad_Cliente — ETAPA 01 EXECUÇÃO

## 1. Resumo executivo

Adição de seleção de localização pelo mapa no cadastro de clientes, reutilizando o componente GpsPickerMap.tsx já existente no projeto sem criar nova lógica de mapa. A integração é feita via modal fullscreen com z-index 60 (acima do modal de cadastro em z-50). O fluxo completo de CEP, Nominatim e campos manuais foi preservado integralmente.

## 2. Evidências usadas

- src/components/map/GpsPickerMap.tsx — componente existente com GPS, clique no mapa, marcador arrastável e callback onConfirm
- src/components/map/LeafletProvider.tsx — wrapper SSR-safe já usado em /dashboard/map e /dashboard/page
- src/app/dashboard/clients/page.tsx — fluxo original completo analisado
- sql/schema_atual_supabase.sql — confirma campos lat, lng, maps_link existentes na tabela clients

## 3. Causa raiz do que foi implementado

O cadastro de clientes já possuía todos os campos de localização e a geocodificação por Nominatim, mas não tinha um fluxo visual de seleção no mapa. O GpsPickerMap.tsx já resolve exatamente esse problema (abre GPS, clique, arrasta, confirma com lat/lng). A implementação conecta os dois.

## 4. Escopo executado

| Item | Ação |
|------|------|
| Estado showMapPicker | Adicionado |
| Estado copiedCoords | Adicionado |
| Botão "Selecionar/Ajustar localização no mapa" | Adicionado na seção de localização |
| Modal fullscreen com GpsPickerMap | Adicionado (z-60, acima do modal de cadastro) |
| handleMapConfirm callback | Adicionado — recebe lat/lng e gera maps_link |
| Card de localização confirmada | Adicionado — aparece quando form.lat && form.lng |
| Botão "Abrir no Maps" | Adicionado no card |
| Botão "Copiar coordenadas" | Adicionado no card com feedback visual |
| Botão "Editar localização" | Adicionado no card |
| Imports: MapPin, ExternalLink, Navigation, Copy, CheckCircle | Adicionados ao import de lucide-react |
| Import: LeafletProvider, GpsPickerMap (dynamic) | Adicionados |

## 5. Arquivos alterados

| Arquivo | Sensibilidade | Tipo |
|---------|--------------|------|
| src/app/dashboard/clients/page.tsx | Alta | Substituição com adições nos pontos corretos |

## 6. Arquivos preservados (sem alteração)

- src/components/map/GpsPickerMap.tsx
- src/components/map/LeafletProvider.tsx
- src/app/api/clients/route.ts
- src/app/api/clients/[id]/route.ts

## 7. Fluxo implementado

Usuário clica "🗺️ Selecionar localização no mapa"
↓
Modal fullscreen abre (z-60) com GpsPickerMap
↓
GpsPickerMap solicita GPS automaticamente
OU usuário clica no mapa
OU usuário arrasta o marcador
↓
Usuário clica "✅ Salvar localização"
↓
handleMapConfirm(lat, lng) é chamado
↓
form atualizado: lat, lng, maps_link
showMapPicker = false
↓
Card de localização aparece no formulário
(botões: Maps | Copiar | Editar)
↓
Usuário salva o cliente normalmente
↓
API /api/clients (POST ou PUT) persiste lat, lng, maps_link

## 8. Compatibilidade garantida

- CEP → lookupCep() intacto, não toca em lat/lng
- Nominatim → busca por texto intacta, continua preenchendo lat/lng/maps_link
- Campos manuais lat/lng/maps_link → preservados abaixo do card
- Editar cliente com localização existente → form.lat/lng carregados → card aparece → mapa abre centralizado
- Cliente sem localização → card não aparece → botão exibe "Selecionar" (sem "Ajustar")

## 9. Riscos

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| dynamic import do GpsPickerMap | Baixo | Padrão já usado em /dashboard/map |
| z-index 60 sobrepor outros elementos | Baixo | Apenas modal de cadastro tem z-50; restante é menor |
| GPS não autorizado pelo usuário | Nenhum | GpsPickerMap já trata esse caso com mensagem e permite clique no mapa |

## 10. Validação

1. npm run lint — verificar tipagem e imports
2. npm run build — verificar SSR e dynamic import
3. Fluxo manual completo — ver testes manuais na seção 4 da implementação

## 11. Impacto documental

- docs/lotes/L032_ETAPA_00_REGISTRO_LOTE.md — criado
- docs/lotes/L032_ETAPA_01_EXECUCAO.md — este arquivo
- docs/changelog.md — atualizar com entrada da feature
- docs/index.md — sem alteração necessária (nenhuma nova página ou API)