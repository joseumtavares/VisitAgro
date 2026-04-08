// src/types/index.ts

export type UserRole = 'admin' | 'user' | 'manager';
export type ClientStatus = 'interessado' | 'visitado' | 'agendado' | 'comprou' | 'naointeressado' | 'retornar' | 'outro';
export type OrderStatus = 'pendente' | 'aprovado' | 'pago' | 'cancelado' | 'faturado';
export type VisitStatus = 'agendado' | 'realizado' | 'cancelado' | 'nao_compareceu';

export interface User {
  id: string;
  username: string;
  email?: string | null;
  pass_hash: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  workspace?: string;
  name: string;
  document?: string | null;
  tel?: string | null;
  email?: string | null;
  status: ClientStatus;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  workspace?: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  unit_price: number;
  stock_qty: number;
  rep_commission_pct?: number;
  active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  workspace?: string;
  order_number?: number | null;
  client_id?: string | null;
  user_id?: string | null;
  date?: string | null;
  status: OrderStatus;
  total: number;
  created_at: string;
}

export interface Commission {
  id: string;
  referral_id?: string | null;
  order_id?: string | null;
  client_id?: string | null;
  amount: number;
  status: 'pendente' | 'paga' | 'cancelada';
  paid_at?: string | null;
  created_at: string;
}