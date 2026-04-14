// src/types/index.ts
// Tipos públicos sincronizados com o schema atual (schema_atual_supabase.sql).
// pass_hash e outros campos sensíveis foram removidos das interfaces públicas.

// ── Enums / unions ────────────────────────────────────────────
export type UserRole     = 'admin' | 'user' | 'manager';
export type ClientStatus = 'interessado' | 'visitado' | 'agendado' | 'comprou' | 'naointeressado' | 'retornar' | 'outro';
export type OrderStatus  = 'pendente' | 'aprovado' | 'pago' | 'cancelado' | 'faturado';
export type VisitStatus  = 'agendado' | 'realizado' | 'cancelado' | 'nao_compareceu';
export type PreRegistrationStatus =   | 'novo'  | 'contatado'   | 'qualificado'  | 'convertido'   | 'perdido';
export type CommissionStatus = 'pendente' | 'paga' | 'cancelada';
export type ActivityType = 'Visita' | 'Ligação' | 'WhatsApp' | 'Email' | 'Reunião';

// ── User ──────────────────────────────────────────────────────
// pass_hash removido: campo sensível que nunca deve trafegar para o frontend.
export interface User {
  id:         string;
  username:   string;
  email?:     string | null;
  name?:      string | null;
  role:       UserRole;
  active:     boolean;
  workspace:  string;
  company_id?: string | null;
  last_login?: string | null;
  created_at: string;
  updated_at?: string;
}

// ── Client ────────────────────────────────────────────────────
export interface Client {
  id:         string;
  workspace?: string;
  name:       string;
  document?:  string | null;
  tel?:       string | null;
  tel2?:      string | null;   // adicionado: schema tem coluna tel2
  email?:     string | null;
  status:     ClientStatus;
  category?:  string | null;   // adicionado: schema tem coluna category
  address?:   string | null;
  city?:      string | null;
  state?:     string | null;
  zip_code?:  string | null;
  lat?:       number | null;
  lng?:       number | null;
  maps_link?: string | null;   // adicionado: usado no frontend e backend
  obs?:       string | null;
  indicado?:  string | null;
  user_id?:   string | null;
  deleted_at?: string | null;  // adicionado: soft delete
  created_at: string;
  updated_at: string;
}

// ── Product ───────────────────────────────────────────────────
export interface Product {
  id:                 string;
  workspace?:         string;
  category_id?:       string | null;
  name:               string;
  description?:       string | null;
  sku?:               string | null;   // adicionado
  finame_code?:       string | null;   // adicionado
  ncm_code?:          string | null;   // adicionado
  unit_price:         number;
  cost_price?:        number | null;   // adicionado
  stock_qty:          number;
  unit?:              string;
  rep_commission_pct?: number | null;
  active:             boolean;
  model?:             string | null;   // adicionado
  color?:             string | null;   // adicionado
  deleted_at?:        string | null;   // adicionado: soft delete
  created_at:         string;
  updated_at?:        string;
}

// ── Order ─────────────────────────────────────────────────────
export interface Order {
  id:               string;
  workspace?:       string;
  order_number?:    number | null;
  client_id?:       string | null;
  referral_id?:     string | null;
  environment_id?:  string | null;
  user_id?:         string | null;
  date?:            string | null;
  status:           OrderStatus;
  total:            number;
  discount?:        number | null;
  commission_type?: string | null;   // adicionado
  commission_pct?:  number | null;
  commission_value?: number | null;  // adicionado: usado em sales/page e commissionHelper
  obs?:             string | null;
  version?:         number | null;   // adicionado: optimistic locking
  deleted_at?:      string | null;   // adicionado: soft delete
  created_at:       string;
  updated_at?:      string;
  // relações opcionais retornadas pelo backend
  clients?:         { name: string } | null;
  referrals?:       { name: string } | null;
}

// ── OrderItem ─────────────────────────────────────────────────
export interface OrderItem {
  id:                 string;
  order_id:           string;
  product_id:         string;
  product_name?:      string | null;
  quantity:           number;
  unit_price:         number;
  total:              number;
  rep_commission_pct?: number | null;
  created_at:         string;
  // relação opcional
  products?:          { name: string } | null;
}

// ── Commission ────────────────────────────────────────────────
export interface Commission {
  id:               string;
  workspace?:       string;
  referral_id?:     string | null;
  referral_name?:   string | null;
  order_id?:        string | null;
  client_id?:       string | null;
  client_name?:     string | null;
  amount:           number;
  commission_type?: string | null;
  status:           CommissionStatus;
  paid_at?:         string | null;
  order_date?:      string | null;
  order_total?:     number | null;
  receipt_photo_ids?: any;
  created_at:       string;
  updated_at?:      string;
}

// ── Referral ──────────────────────────────────────────────────
export interface Referral {
  id:               string;
  workspace?:       string;
  name:             string;
  document?:        string | null;
  tel?:             string | null;
  email?:           string | null;
  commission_type:  'fixed' | 'percent';
  commission_pct?:  number | null;
  commission?:      number | null;
  active:           boolean;
  bank_name?:       string | null;
  bank_agency?:     string | null;
  bank_account?:    string | null;
  bank_pix?:        string | null;
  deleted_at?:      string | null;
  created_at:       string;
  updated_at?:      string;
}

// ── Visit ─────────────────────────────────────────────────────
export interface Visit {
  id:             string;
  workspace?:     string;
  client_id?:     string | null;
  user_id?:       string | null;
  activity_type?: ActivityType | null;
  scheduled_date?: string | null;
  visit_date?:    string | null;
  status:         VisitStatus;
  obs?:           string | null;
  lat?:           number | null;
  lng?:           number | null;
  photos?:        any;
  deleted_at?:    string | null;
  created_at:     string;
  updated_at?:    string;
}
// ── PreRegistration ─────────────────────────────────────────────
export interface PreRegistration {
  id: string;
  workspace?: string;
  name: string;
  tel?: string | null;
  email?: string | null;
  interest?: string | null;
  source?: string | null;
  status: PreRegistrationStatus;
  obs?: string | null;
  converted_client_id?: string | null;

  // campos adicionados na migration nova
  referral_id?: string | null;
  maps_link?: string | null;
  lat?: number | null;
  lng?: number | null;
  point_reference?: string | null;
  deleted_at?: string | null;

  created_at: string;
  updated_at: string;
}
// ── Category ──────────────────────────────────────────────────
export interface Category {
  id:           string;
  workspace?:   string;
  name:         string;
  description?: string | null;
  active:       boolean;
  created_at:   string;
  updated_at?:  string;
}

// ── Company ───────────────────────────────────────────────────
export interface Company {
  id:          string;
  name:        string;
  trade_name?: string | null;
  document?:   string | null;
  address?:    string | null;
  city?:       string | null;
  state?:      string | null;
  zip_code?:   string | null;
  phone?:      string | null;
  email?:      string | null;
  logo_url?:   string | null;
  active?:     boolean;
  created_at:  string;
  updated_at?: string;
}
