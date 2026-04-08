export interface User {
  id: string;
  company_id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  trade_name?: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  logo_url?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  trade_name?: string;
  document?: string;
  email?: string;
  phone?: string;
  secondary_phone?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  status: 'prospect' | 'active' | 'inactive' | 'blocked';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  tags: string[];
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  category_id?: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  unit: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  company_id: string;
  client_id?: string;
  user_id?: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  discount: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  shipping_address?: string;
  notes?: string;
  scheduled_date?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  company_id: string;
  client_id: string;
  user_id?: string;
  environment_id?: string;
  title: string;
  description?: string;
  type: 'visita' | 'reuniao' | 'ligacao' | 'whatsapp' | 'email';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  scheduled_date: string;
  duration_minutes: number;
  actual_start?: string;
  actual_end?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  follow_up_notes?: string;
  next_appointment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  interest_level: 'low' | 'medium' | 'high';
  notes?: string;
  assigned_to?: string;
  converted_client_id?: string;
  created_at: string;
  updated_at: string;
}

export interface KmLog {
  id: string;
  company_id: string;
  user_id: string;
  appointment_id?: string;
  client_id?: string;
  start_odometer: number;
  end_odometer: number;
  distance: number;
  start_location?: string;
  end_location?: string;
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  purpose?: string;
  vehicle_info?: string;
  fuel_cost?: number;
  notes?: string;
  date: string;
  created_at: string;
}

export interface Indicator {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  type: string;
  target_value?: number;
  current_value: number;
  unit?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalesCommission {
  id: string;
  company_id: string;
  user_id: string;
  product_id?: string;
  category_id?: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  min_value?: number;
  max_value?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Environment {
  id: string;
  client_id: string;
  company_id: string;
  name: string;
  type?: string;
  area?: number;
  area_unit: string;
  latitude?: number;
  longitude?: number;
  polygon?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type StatusColorMap = {
  [key: string]: string;
};

export const CLIENT_STATUS_COLORS: StatusColorMap = {
  prospect: '#3b82f6',    // azul
  active: '#10b981',      // verde
  inactive: '#6b7280',    // cinza
  blocked: '#ef4444',     // vermelho
};

export const APPOINTMENT_STATUS_COLORS: StatusColorMap = {
  scheduled: '#3b82f6',   // azul
  confirmed: '#10b981',   // verde
  in_progress: '#f59e0b', // amarelo/laranja
  completed: '#6b7280',   // cinza
  cancelled: '#ef4444',   // vermelho
  no_show: '#8b5cf6',     // roxo
};
