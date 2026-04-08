-- ============================================
-- AGROVISITA PRO - Schema Completo do Banco de Dados
-- Combinação das funcionalidades: AgrovisitaV3_2 + Visitas 10_3
-- PostgreSQL com Supabase
-- ============================================

-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- TABELA DE EMPRESAS (Multi-tenancy)
-- ============================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    document VARCHAR(20),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    country VARCHAR(100) DEFAULT 'Brasil',
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE USUÁRIOS
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- admin, manager, user, viewer
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE CATEGORIAS DE PRODUTOS
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    color VARCHAR(7),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE PRODUTOS
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    unit VARCHAR(20) DEFAULT 'UN',
    price DECIMAL(12,2) DEFAULT 0,
    cost DECIMAL(12,2) DEFAULT 0,
    stock DECIMAL(12,2) DEFAULT 0,
    min_stock DECIMAL(12,2) DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE CLIENTES (COM GEOLOCALIZAÇÃO)
-- ============================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    document VARCHAR(20),
    email VARCHAR(255),
    phone VARCHAR(20),
    secondary_phone VARCHAR(20),
    address TEXT,
    number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    status VARCHAR(50) DEFAULT 'prospect', -- prospect, active, inactive, blocked
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    notes TEXT,
    tags JSONB DEFAULT '[]',
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas geoespaciais
CREATE INDEX idx_clients_location ON clients USING GIST (
    ll_to_earth(latitude, longitude)
);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_company ON clients(company_id);

-- ============================================
-- TABELA DE AMBIENTES/PROPRIEDADES
-- ============================================
CREATE TABLE environments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- fazenda, estufa, campo, etc
    area DECIMAL(12,2), -- em hectares
    area_unit VARCHAR(20) DEFAULT 'ha',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    polygon JSONB, -- coordenadas do polígono
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE PEDIDOS
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
    total DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    shipping_cost DECIMAL(12,2) DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    shipping_address TEXT,
    notes TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE ITENS DO PEDIDO
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE INDICADORES (KPIs)
-- ============================================
CREATE TABLE indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50), -- sales, visits, conversion, revenue, etc
    target_value DECIMAL(12,2),
    current_value DECIMAL(12,2) DEFAULT 0,
    unit VARCHAR(50),
    period VARCHAR(50) DEFAULT 'monthly', -- daily, weekly, monthly, yearly
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE COMISSÕES POR INDICADOR
-- ============================================
CREATE TABLE indicator_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_id UUID REFERENCES indicators(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    commission_type VARCHAR(50) DEFAULT 'percentage', -- percentage, fixed
    commission_value DECIMAL(12,2) NOT NULL,
    min_target DECIMAL(12,2),
    max_target DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE COMISSÕES DE VENDA
-- ============================================
CREATE TABLE sales_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    commission_type VARCHAR(50) DEFAULT 'percentage', -- percentage, fixed
    commission_value DECIMAL(12,2) NOT NULL,
    min_value DECIMAL(12,2), -- valor mínimo da venda para aplicar comissão
    max_value DECIMAL(12,2), -- valor máximo da venda para aplicar comissão
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE PAGAMENTOS DE COMISSÃO
-- ============================================
CREATE TABLE commission_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    indicator_id UUID REFERENCES indicators(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    reference_period VARCHAR(20), -- ex: 2024-01
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid, cancelled
    payment_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE AGENDAMENTOS/VISITAS
-- ============================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    environment_id UUID REFERENCES environments(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50), -- visita, reuniao, ligacao, whatsapp, email
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled, no_show
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    notes TEXT,
    follow_up_notes TEXT,
    next_appointment_id UUID REFERENCES appointments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE PRÉ-CADASTRO (LEADS)
-- ============================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    source VARCHAR(50), -- website, indicacao, rede_social, evento, etc
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, converted, lost
    interest_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE CONTROLE DE KM (QUILOMETRAGEM)
-- ============================================
CREATE TABLE km_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    start_odometer DECIMAL(12,2) NOT NULL,
    end_odometer DECIMAL(12,2) NOT NULL,
    distance DECIMAL(12,2) NOT NULL, -- km percorridos
    start_location VARCHAR(255),
    end_location VARCHAR(255),
    start_latitude DECIMAL(10,8),
    start_longitude DECIMAL(11,8),
    end_latitude DECIMAL(10,8),
    end_longitude DECIMAL(11,8),
    purpose TEXT,
    vehicle_info VARCHAR(255),
    fuel_cost DECIMAL(12,2),
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE HISTÓRICO DE ATIVIDADES
-- ============================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL, -- client, product, order, appointment, etc
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- create, update, delete, view
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE SESSÕES JWT (OPCIONAL)
-- ============================================
CREATE TABLE jwt_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked BOOLEAN DEFAULT false
);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_environments_updated_at BEFORE UPDATE ON environments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indicators_updated_at BEFORE UPDATE ON indicators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indicator_commissions_updated_at BEFORE UPDATE ON indicator_commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_commissions_updated_at BEFORE UPDATE ON sales_commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_payments_updated_at BEFORE UPDATE ON commission_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÃO PARA GERAR NÚMERO DO PEDIDO
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'PED-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_order_insert
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - CONFIGURAÇÕES BÁSICAS
-- ============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE km_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Política básica: usuários só veem dados da sua empresa
CREATE POLICY company_isolation_policy ON clients
    FOR ALL
    USING (company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

-- ============================================
-- DADOS INICIAIS DE EXEMPLO (SEED)
-- ============================================
-- Empresa padrão
INSERT INTO companies (id, name, trade_name, email, phone, country) VALUES
('00000000-0000-0000-0000-000000000001', 'Agrovisita Pro', 'Agrovisita Pro', 'contato@agrovisita.com.br', '(11) 99999-9999', 'Brasil');

-- Usuário admin padrão (senha: admin123 - hash será gerado na aplicação)
-- A senha deve ser hashada usando bcrypt na aplicação antes de inserir

-- ============================================
-- VIEWS ÚTEIS
-- ============================================
-- View de resumo de clientes por status
CREATE VIEW client_summary AS
SELECT 
    company_id,
    status,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as with_location
FROM clients
GROUP BY company_id, status;

-- View de performance de vendas por usuário
CREATE VIEW user_sales_performance AS
SELECT 
    u.id as user_id,
    u.name,
    u.company_id,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_revenue,
    COALESCE(SUM(cp.amount), 0) as total_commissions
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
LEFT JOIN commission_payments cp ON u.id = cp.user_id
GROUP BY u.id, u.name, u.company_id;

-- View de próximos agendamentos
CREATE VIEW upcoming_appointments AS
SELECT 
    a.*,
    c.name as client_name,
    c.phone as client_phone,
    u.name as user_name
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN users u ON a.user_id = u.id
WHERE a.scheduled_date >= NOW()
    AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.scheduled_date ASC;

COMMENT ON TABLE companies IS 'Empresas do sistema (multi-tenancy)';
COMMENT ON TABLE users IS 'Usuários do sistema com autenticação JWT';
COMMENT ON TABLE clients IS 'Clientes com geolocalização para mapa';
COMMENT ON TABLE products IS 'Produtos cadastrados com estoque e preços';
COMMENT ON TABLE categories IS 'Categorias de produtos hierárquicas';
COMMENT ON TABLE orders IS 'Pedidos de venda com itens';
COMMENT ON TABLE appointments IS 'Agendamentos de visitas técnicas';
COMMENT ON TABLE leads IS 'Pré-cadastros/Leads para conversão';
COMMENT ON TABLE km_logs IS 'Controle de quilometragem das visitas';
COMMENT ON TABLE indicators IS 'Indicadores de desempenho (KPIs)';
COMMENT ON TABLE sales_commissions IS 'Regras de comissão por venda';
COMMENT ON TABLE indicator_commissions IS 'Comissões por atingimento de indicadores';
