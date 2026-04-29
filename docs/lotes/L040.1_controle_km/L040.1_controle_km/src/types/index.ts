// =============================================================================
// PATCH L040.1 — INSTRUÇÃO DE APLICAÇÃO
//
// Abrir o arquivo real: src/types/index.ts
// Localizar o final do arquivo (último export/interface existente)
// Colar o bloco abaixo logo em seguida, SEM reordenar nada existente.
// =============================================================================

// AI-CONTRACT: KmLog espelha exatamente a tabela public.km_logs.
// Campos calculados (percorrido, consumo, custo_por_km) são preenchidos
// pelo backend — a UI pode pré-visualizar, mas nunca envia esses valores no body.
export interface KmLog {
  id:           string;
  workspace:    string;
  user_id:      string;
  data:         string;         // ISO date: 'YYYY-MM-DD'
  veiculo:      string;
  km_ini:       number;
  km_fim:       number;
  percorrido:   number;         // calculado no backend: km_fim - km_ini
  litros:       number | null;
  combustivel:  number | null;
  consumo:      number | null;  // calculado no backend: percorrido / litros
  custo_por_km: number | null;  // calculado no backend: combustivel / percorrido
  obs:          string | null;
  created_at:   string;
  updated_at:   string;
  deleted_at:   string | null;
}

// REGRA: user_id e workspace NÃO são enviados — vêm do token JWT via middleware.
export interface KmLogCreatePayload {
  data:         string;
  veiculo:      string;
  km_ini:       number;
  km_fim:       number;
  litros?:      number;
  combustivel?: number;
  obs?:         string;
}

export interface KmLogUpdatePayload {
  data?:         string;
  veiculo?:      string;
  km_ini?:       number;
  km_fim?:       number;
  litros?:       number | null;
  combustivel?:  number | null;
  obs?:          string | null;
}
