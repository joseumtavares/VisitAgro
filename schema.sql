-- Agrovisita Pro Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'sales',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'prospect',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  category_id UUID REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'UN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES clients(id),
  user_id UUID REFERENCES users(id),
  total_amount DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);

CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES clients(id),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  source VARCHAR(100),
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE km_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  start_km INTEGER NOT NULL,
  end_km INTEGER,
  start_location VARCHAR(255),
  end_location VARCHAR(255),
  trip_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE indicators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_value DECIMAL(10, 2),
  unit VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sales_commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  percentage DECIMAL(5, 2) NOT NULL,
  min_amount DECIMAL(10, 2) DEFAULT 0,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE indicator_commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  indicator_id UUID REFERENCES indicators(id),
  user_id UUID REFERENCES users(id),
  bonus_value DECIMAL(10, 2) NOT NULL,
  condition_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE commission_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  reference_month DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE environments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES clients(id),
  name VARCHAR(255) NOT NULL,
  area_hectares DECIMAL(10, 2),
  location_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_location ON clients(latitude, longitude);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_for);

INSERT INTO companies (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Agrovisita Pro');

INSERT INTO users (company_id, email, password_hash, name, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'admin@agrovisita.com.br', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G.4.4.4.4.4.4.4', 
  'Administrador', 
  'admin'
);

INSERT INTO categories (company_id, name) VALUES 
('00000000-0000-0000-0000-000000000001', 'Defensivos'),
('00000000-0000-0000-0000-000000000001', 'Fertilizantes'),
('00000000-0000-0000-0000-000000000001', 'Sementes'),
('00000000-0000-0000-0000-000000000001', 'Maquinário');