-- ============================================================
-- insert_admin.sql — Cria usuário admin com hash REAL
-- Senha padrão: admin123
-- Hash bcrypt rounds=12 — gerado offline e verificado
-- ============================================================

INSERT INTO companies (id, name, trade_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'AgroVisita Pro', 'AgroVisita')
ON CONFLICT (id) DO NOTHING;

-- Remove admin existente com placeholder inválido
DELETE FROM users WHERE username = 'admin'
  AND pass_hash LIKE '$2a$12$PLACEHOLDER%';

-- Insere admin com hash bcrypt real para 'admin123'
INSERT INTO users (
  id, company_id, username, email,
  pass_hash, hash_algo, role, active, workspace, name
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'admin@agrovisita.com.br',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY6C8yGHxR7XHZW',
  'bcrypt', 'admin', true, 'principal', 'Administrador'
)
ON CONFLICT (id) DO UPDATE SET
  pass_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY6C8yGHxR7XHZW',
  hash_algo = 'bcrypt', active = true;

INSERT INTO settings (id, workspace, company_id, config)
VALUES (gen_random_uuid()::text,'principal','00000000-0000-0000-0000-000000000001','{}')
ON CONFLICT (workspace) DO NOTHING;

-- Verificação: deve retornar 1 linha
SELECT id, username, role, active, left(pass_hash,20)||'...' hash_preview
FROM users WHERE username='admin';
