
─── Cole este UPDATE no SQL Editor do Supabase ───────

UPDATE users
  SET pass_hash = 'pbkdf2:sha512:100000:1d8b1fe491ff7a20bf63d0fcbaaa11df:f84e78753d1d28470e230d8b7f82eef0bb41eae5f9edbd9f94a7909288b65669d95b7349331f9a092fd9a8b6f2a01d82fb397ef2742df6715fdd7f4fe3847bb8',
      hash_algo = 'pbkdf2'
  WHERE username = 'admin';

─── OU use o INSERT completo ─────────────────────────

INSERT INTO users
  (username, email, pass_hash, hash_algo, role, active, workspace, name)
VALUES
  ('admin', 'admin@agrovisita.com.br',
   'pbkdf2:sha512:100000:1d8b1fe491ff7a20bf63d0fcbaaa11df:f84e78753d1d28470e230d8b7f82eef0bb41eae5f9edbd9f94a7909288b65669d95b7349331f9a092fd9a8b6f2a01d82fb397ef2742df6715fdd7f4fe3847bb8',
   'pbkdf2', 'admin', true, 'principal', 'Administrador')
ON CONFLICT (username) DO UPDATE
  SET pass_hash = EXCLUDED.pass_hash,
      hash_algo = EXCLUDED.hash_algo;