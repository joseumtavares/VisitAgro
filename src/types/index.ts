// ============================================================
// VisitAgro — src/types/index.ts
// Atualizado em v0.9.6: adicionado RepCommission
// ============================================================

export type OrderStatus =
  | 'pendente'
  | 'aprovado'
  | 'pago'
  | 'cancelado'
  | 'faturado';

export type CommissionStatus = 'pendente' | 'paga' | 'cancelada';

export type UserRole = 'admin' | 'user' | 'manager';

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  name?: string;
  role: UserRole;
  workspace: string;
  company_id?: string;
}

export interface Client {
  id: string;
  workspace: string;
  name: string;
  document?: string | null;
  tel?: string | null;
  tel2?: string | null;
  email?: string | null;
  status?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  lat?: number | null;
  lng?: number | null;
  maps_link?: string | null;
  obs?: string | null;
  indicado?: string | null;
  user_id?: string | null;
  document_front_path?: string | null;
  document_back_path?: string | null;
  residence_proof_path?: string | null;
  category?: string | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Product {
  id: string;
  workspace: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  sku?: string | null;
  finame_code?: string | null;
  ncm_code?: string | null;
  unit_price?: number | null;
  cost_price?: number | null;
  stock_qty?: number | null;
  unit?: string | null;
  rep_commission_pct?: number | null;
  active?: boolean | null;
  model?: string | null;
  color?: string | null;
  is_composite?: boolean | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Category {
  id: string;
  workspace: string;
  name: string;
  description?: string | null;
  active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  rep_commission_pct?: number | null;
  created_at?: string | null;
  products?: { name: string } | null;
}

export interface Order {
  id: string;
  workspace: string;
  order_number?: number | null;
  client_id?: string | null;
  referral_id?: string | null;
  environment_id?: string | null;
  user_id?: string | null;
  date?: string | null;
  status: OrderStatus;
  total: number;
  discount?: number | null;
  commission_type?: string | null;
  commission_pct?: number | null;
  commission_value?: number | null;
  obs?: string | null;
  version: number;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  clients?: { name: string } | null;
  referrals?: { name: string } | null;
  order_items?: OrderItem[];
}

export interface Referral {
  id: string;
  workspace: string;
  name: string;
  document?: string | null;
  tel?: string | null;
  email?: string | null;
  commission_type?: string | null;
  commission_pct?: number | null;
  commission?: number | null;
  active?: boolean | null;
  bank_name?: string | null;
  bank_agency?: string | null;
  bank_account?: string | null;
  bank_pix?: string | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Commission {
  id: string;
  workspace: string;
  referral_id?: string | null;
  referral_name?: string | null;
  order_id?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  amount: number;
  commission_type?: string | null;
  status: CommissionStatus;
  receipt_photo_ids?: string[] | null;
  paid_at?: string | null;
  order_date?: string | null;
  order_total?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Comissão de representante (uma por order_item com rep_commission_pct > 0) */
export interface RepCommission {
  id: string;
  workspace: string;
  rep_id?: string | null;
  rep_name?: string | null;
  order_id?: string | null;
  order_item_id?: string | null;
  order_date?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  qty?: number | null;
  unit_price?: number | null;
  rep_commission_pct?: number | null;
  amount: number;
  order_total?: number | null;
  status: CommissionStatus;
  receipt_photo_ids?: string[] | null;
  paid_at?: string | null;
  reprocessed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Visit {
  id: string;
  workspace: string;
  client_id?: string | null;
  user_id?: string | null;
  activity_type?: string | null;
  scheduled_date?: string | null;
  visit_date?: string | null;
  status?: string | null;
  obs?: string | null;
  lat?: number | null;
  lng?: number | null;
  photos?: unknown[];
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Settings {
  id: string;
  workspace: string;
  company_id?: string | null;
  config?: Record<string, unknown> | null;
  dev_pin_hash?: string | null;
  dev_mode_expires?: string | null;
  updated_at?: string | null;
}

export interface Company {
  id: string;
  name: string;
  trade_name?: string | null;
  document?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// ── Pré-cadastros / Leads ─────────────────────────────────────
export type PreRegistrationStatus =
  | 'novo'
  | 'contatado'
  | 'qualificado'
  | 'convertido'
  | 'perdido';

export interface PreRegistration {
  id: string;
  workspace: string;
  name: string;
  tel?: string | null;
  email?: string | null;
  interest?: string | null;
  source?: string | null;
  status: PreRegistrationStatus;
  obs?: string | null;
  converted_client_id?: string | null;
  referral_id?: string | null;
  maps_link?: string | null;
  lat?: number | null;
  lng?: number | null;
  point_reference?: string | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
