-- ============================================================
-- INSERT/UPDATE do usuário admin — execute no Supabase SQL Editor
-- Senha: admin123  |  hash_algo: sha256 (aceito pelo CHECK constraint)
-- ============================================================

-- 1. Garante que a empresa padrão existe
INSERT INTO companies (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Agrovisita Pro')
ON CONFLICT (id) DO NOTHING;

-- 2. Insere ou atualiza o usuário admin
INSERT INTO users (
  id,
  username,
  email,
  pass_hash,
  hash_algo,
  role,
  active,
  workspace
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'admin',
  'admin@agrovisita.com.br',
  'sha256:7f3a9c2e1b4d5e6f8a0b1c2d3e4f5a6b:9112dc14b786a17d1158078dda4eeee77aa6c4f29682a3832b1da434245ccb0c',
  'sha256',
  'admin',
  true,
  'principal'
)
ON CONFLICT (id) DO UPDATE SET
  pass_hash  = EXCLUDED.pass_hash,
  hash_algo  = EXCLUDED.hash_algo,
  active     = true,
  username   = EXCLUDED.username;

-- 3. Verifica resultado
SELECT
  id,
  username,
  email,
  role,
  active,
  hash_algo,
  LEFT(pass_hash, 20) || '...' AS hash_preview
FROM users
WHERE username = 'admin';
