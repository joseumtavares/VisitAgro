export interface Client {
  id: string;
  name: string;
  status: 'prospect' | 'active' | 'inactive' | 'blocked';
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  company_id: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category_id: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'sales';
}