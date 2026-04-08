/**
 * Gerador de hash SHA-256 STANDALONE — zero dependências externas
 * Compatível com hash_algo='sha256' da tabela users do Agrovisita
 * Funciona com Node.js v14+ sem npm install
 *
 * COMO USAR (pode ser executado em qualquer pasta):
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

const saltBytes = crypto.randomBytes(16);
const saltHex   = saltBytes.toString('hex');

crypto.pbkdf2(password, saltBytes, 100000, 32, 'sha256', (err, dk) => {
  if (err) { console.error(err); process.exit(1); }

  const stored = `sha256:${saltHex}:${dk.toString('hex')}`;

  console.log('\n╔═════════════════════════════════════════════════════╗');
  console.log('║           HASH GERADO COM SUCESSO                  ║');
  console.log('╚═════════════════════════════════════════════════════╝\n');
  console.log('Senha     :', password);
  console.log('Hash      :', stored);
  console.log('hash_algo : sha256\n');

  console.log('─── Cole este SQL no Editor do Supabase ──────────────\n');
  console.log(`INSERT INTO users (username, email, pass_hash, hash_algo, role, active, workspace)`);
  console.log(`VALUES (`);
  console.log(`  'admin',`);
  console.log(`  'admin@agrovisita.com.br',`);
  console.log(`  '${stored}',`);
  console.log(`  'sha256',`);
  console.log(`  'admin', true, 'principal'`);
  console.log(`)`);
  console.log(`ON CONFLICT (username) DO UPDATE SET`);
  console.log(`  pass_hash = EXCLUDED.pass_hash,`);
  console.log(`  hash_algo = EXCLUDED.hash_algo,`);
  console.log(`  active    = true;\n`);
});
