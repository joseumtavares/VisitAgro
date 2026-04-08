/**
 * Gerador de hash bcrypt STANDALONE
 * Zero dependências — usa apenas crypto nativo do Node.js
 * Compatível com Node.js v14+
 *
 * COMO USAR (pode estar em QUALQUER pasta):
 *   node generate-hash-standalone.js admin123
 */
'use strict';
const crypto = require('crypto');

const password = process.argv[2];
if (!password) {
  console.error('\nUso: node generate-hash-standalone.js <senha>');
  console.error('Ex:  node generate-hash-standalone.js admin123\n');
  process.exit(1);
}

const ITERATIONS = 100000;
const KEYLEN     = 64;
const DIGEST     = 'sha512';
const salt       = crypto.randomBytes(16).toString('hex');

crypto.pbkdf2(password, salt, ITERATIONS, KEYLEN, DIGEST, (err, dk) => {
  if (err) { console.error(err); process.exit(1); }

  const hash   = dk.toString('hex');
  const stored = `pbkdf2:${DIGEST}:${ITERATIONS}:${salt}:${hash}`;

  console.log('\n╔═════════════════════════════════════════════════════╗');
  console.log('║         HASH GERADO COM SUCESSO                    ║');
  console.log('╚═════════════════════════════════════════════════════╝\n');
  console.log('Senha :', password);
  console.log('Hash  :', stored);
  console.log('\n─── Cole este UPDATE no SQL Editor do Supabase ───────');
  console.log(`\nUPDATE users\n  SET pass_hash = '${stored}',\n      hash_algo = 'pbkdf2'\n  WHERE username = 'admin';\n`);
  console.log('─── OU use o INSERT completo ─────────────────────────');
  console.log(`\nINSERT INTO users`);
  console.log(`  (username, email, pass_hash, hash_algo, role, active, workspace, name)`);
  console.log(`VALUES`);
  console.log(`  ('admin', 'admin@agrovisita.com.br',`);
  console.log(`   '${stored}',`);
  console.log(`   'pbkdf2', 'admin', true, 'principal', 'Administrador')`);
  console.log(`ON CONFLICT (username) DO UPDATE`);
  console.log(`  SET pass_hash = EXCLUDED.pass_hash,`);
  console.log(`      hash_algo = EXCLUDED.hash_algo;\n`);
});
