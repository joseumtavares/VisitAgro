// =============================================================================
// PATCH L040.1 — INSTRUÇÃO DE APLICAÇÃO EM DashboardShell.tsx
//
// Arquivo real: src/components/layout/DashboardShell.tsx
// NÃO reescrever o arquivo inteiro. Aplicar APENAS as 2 alterações abaixo.
// =============================================================================

// ---------------------------------------------------------------------------
// ALTERAÇÃO 1 — Import do ícone Car
//
// Localizar a linha de import de ícones Lucide, por exemplo:
//   import { LayoutDashboard, Users, ... } from 'lucide-react';
//
// Adicionar "Car" à lista existente:
//   import { LayoutDashboard, Users, ..., Car } from 'lucide-react';
//
// Se Car já estiver importado: nenhuma ação.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ALTERAÇÃO 2 — Entrada no array de navegação (NAV_ITEMS ou equivalente)
//
// Localizar o array de itens de navegação (pode se chamar NAV_ITEMS, navItems,
// LINKS, navLinks — confirmar o nome real no arquivo antes de editar).
//
// Adicionar a entrada abaixo como ÚLTIMO item do array, antes do fechamento ]:
//
// ATENÇÃO: verificar o tamanho de classe do ícone (w-4 h-4 ou w-5 h-5)
//          comparando com os outros ícones no array e usar o mesmo.
// ---------------------------------------------------------------------------

/*
  {
    href:  '/dashboard/km',
    label: 'Controle de KM',
    icon:  <Car className="w-5 h-5" />,
    // AI-RULE: role 'user' não tem acesso — API retorna 403 se tentar.
    // Se o projeto usar hideForRepresentative ou hiddenForRoles[]:
    //   hiddenForRoles: ['user'],
    // Caso contrário, o item aparece mas a API bloqueia com 403.
  },
*/

// ---------------------------------------------------------------------------
// CONTEXTO — padrão real confirmado via L036-A_ETAPA_01_EXECUCAO.md
//
// O DashboardShell usa:
//   - interface NavItem { href, label, icon, adminOnly?, hideForRepresentative? }
//   - const visibleNav = NAV_ITEMS.filter(item =>
//       !(item.adminOnly && role === 'representative') &&
//       !(item.hideForRepresentative && role === 'representative')
//     )
//
// Para o módulo KM:
//   - adminOnly: false (representative DEVE ver e usar)
//   - hideForRepresentative: false
//   - Se quiser bloquear role 'user': adicionar campo customizado ou
//     deixar a API como barreira (403 já implementado na rota).
// ---------------------------------------------------------------------------
