# GUIA DE APLICAÇÃO — L040

**Pacote:** ui-visitas-converter-lead.zip
**Lote:** L040 — UI de Histórico de Visitas + Botão "Converter em Cliente"

---

## Resumo da implementação

Este lote entrega duas ausências de UI cujas APIs já existiam e funcionavam:

1. **Página `/dashboard/visits`** — listagem de visitas com filtros, busca, cards mobile e tabela desktop.
2. **Botão "Converter em Cliente"** na página `/dashboard/pre-registrations`.
3. **Item "Visitas"** no menu lateral (`DashboardShell`).

**Zero alteração de schema. Zero alteração de rotas de API.**

---

## Lista de arquivos novos

| Arquivo | Destino |
|---|---|
| `novos-arquivos/src/app/dashboard/visits/page.tsx` | `src/app/dashboard/visits/page.tsx` |

---

## Lista de arquivos alterados

| Arquivo | Destino | Sensibilidade |
|---|---|---|
| `patches/src/app/dashboard/pre-registrations/pre-registrations-page.tsx` | `src/app/dashboard/pre-registrations/pre-registrations-page.tsx` | Média |
| `patches/src/components/layout/DashboardShell.tsx` | `src/components/layout/DashboardShell.tsx` | Alta |

---

## Arquivos sensíveis / risco de conflito

- `DashboardShell.tsx` — impacta todas as páginas do dashboard. Verificar conflitos com outros branches antes de aplicar.
- `pre-registrations-page.tsx` — arquivo grande; se houver branch paralelo editando este arquivo, fazer merge manual e comparar as seções L040 (marcadas com `// L040:`).

---

## Ordem obrigatória de aplicação

```
1. src/app/dashboard/visits/page.tsx          (novo — criar pasta se necessário)
2. src/app/dashboard/pre-registrations/pre-registrations-page.tsx  (substituir)
3. src/components/layout/DashboardShell.tsx   (substituir)
4. docs/lotes/L040_ETAPA_01_EXECUCAO.md       (novo)
```

Não há dependência de banco ou migration. A ordem acima é por segurança (UI antes de nav).

---

## Dependências

| Tipo | Dependência | Status |
|---|---|---|
| API | `GET /api/visits` | ✅ Já existe |
| API | `GET /api/clients` | ✅ Já existe |
| API | `POST /api/pre-registrations/[id]/convert` | ✅ Já existe |
| Banco | Nenhuma migration | ✅ Sem alteração |
| lucide-react | `CalendarCheck` em v0.378.0 | ⚠️ Verificar antes do deploy |

---

## Verificação crítica antes do deploy

```bash
# Verificar que CalendarCheck existe na versão instalada
grep -r "CalendarCheck" node_modules/lucide-react/dist/lucide-react.js | head -1

# Se não encontrar, substituir em DashboardShell.tsx:
# - import: CalendarCheck → Calendar
# - NAV_ITEMS: <CalendarCheck className="w-4 h-4" /> → <Calendar className="w-4 h-4" />
```

---

## Validação mínima após aplicação

```bash
# 1. Lint
npm run lint

# 2. Build
npm run build

# 3. Fluxo Visitas
# - /dashboard/visits carrega sem erro
# - Filtro de status filtra corretamente
# - Cards visíveis em 375px; tabela em 640px+
# - "Ir para o Mapa" navega para /dashboard/map

# 4. Fluxo Converter Lead
# - /dashboard/pre-registrations mostra ícone UserPlus para leads não-convertidos
# - Clicar abre modal de confirmação
# - Confirmar chama API e exibe toast de sucesso
# - Lead convertido muda status para "Convertido" e perde o botão

# 5. Menu lateral
# - Item "Visitas" aparece entre "Mapa" e "Configurações"
# - Link navega para /dashboard/visits
# - Menu fecha no mobile após clicar
```

---

## Riscos conhecidos

| Risco | Impacto | Ação |
|---|---|---|
| `CalendarCheck` ausente em lucide 0.378 | Erro de build | Trocar por `Calendar` |
| Conflito no DashboardShell | Merge incorreto | Fazer merge manual das linhas marcadas com `L040` |
| Conflito no pre-registrations-page | Perda de lógica L038 | Comparar seções marcadas `// L040:` e reintegrar |

---

## Rollback

Os 3 arquivos são independentes do backend. Para reverter:

```bash
# Opção 1: reverter o commit
git revert HEAD

# Opção 2: restaurar arquivos individualmente
git checkout HEAD~1 -- src/components/layout/DashboardShell.tsx
git checkout HEAD~1 -- src/app/dashboard/pre-registrations/pre-registrations-page.tsx
# Remover a pasta de visitas
rm -rf src/app/dashboard/visits
```
