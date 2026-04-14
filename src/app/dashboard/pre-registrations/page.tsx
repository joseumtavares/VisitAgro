// Este arquivo é o entry point do Next.js App Router para a rota
// /dashboard/pre-registrations. Toda a implementação real está em
// pre-registrations-page.tsx, que contém:
//   - useSearchParams com <Suspense> correto (Next.js 14 obrigatório)
//   - MapParamsReader: lê ?lat, ?lng, ?maps_link vindos do InteractiveMap
//   - handleMapParams: abre o modal já com coordenadas preenchidas
//   - handleEditRequest: abre o modal de edição via ?edit=<id>
//   - banner cyan de orientação quando o modal abre via mapa
//   - autoFocus no campo Nome quando o modal abre via mapa
export { default } from './pre-registrations-page';
