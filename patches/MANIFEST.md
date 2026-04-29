# MANIFEST — L040.1_controle_km
# Data: 2026-04-28
# Executor: Agente 02 (Claude)

## Arquivos novos (criar no repositório)

sql/060_controle_km_logs.sql
src/app/api/km-logs/route.ts
src/app/api/km-logs/[id]/route.ts
src/app/dashboard/km/page.tsx
docs/patches/060_controle_km_logs.md
docs/lotes/L040.1_controle_km_ETAPA_01_EXECUCAO.md

## Arquivos a editar (patch localizado — ler instruções no topo do arquivo)

src/types/index.ts          → colar bloco KmLog ao FINAL do arquivo real
src/components/layout/DashboardShell.tsx  → adicionar import Car + 1 entrada no array nav

## Arquivos a atualizar manualmente (não incluídos — entrada documentada no ETAPA_01)

docs/changelog.md           → entrada L040.1 conforme ETAPA_01_EXECUCAO.md
docs/index.md               → linha do patch 060 na tabela de patches

## Arquivos NÃO tocados (confirmados preservados)

middleware.ts
src/lib/supabaseAdmin.ts
src/lib/apiFetch.ts
src/lib/auth.ts
src/lib/requestContext.ts
src/store/authStore.ts
src/app/layout.tsx
vercel.json
