/**
 * Gera um hash bcrypt para uso no banco de dados.
 * 
 * Uso:
 *   node scripts/generate-password-hash.js <senha>
 *   node scripts/generate-password-hash.js admin123
 *
 * O hash gerado deve ser inserido na coluna `pass_hash` da tabela `users`.
 * 
 * Exemplo de UPDATE no Supabase:
 *   UPDATE users SET pass_hash = '<hash_aqui>' WHERE username = 'admin';
 */

const bcrypt = require('bcryptjs');

async function generateHash(password) {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('\n=== Hash Gerado ===');
  console.log('Senha  :', password);
  console.log('Hash   :', hash);
  console.log('===================\n');
  
  console.log('── SQL para inserir/atualizar no Supabase ──');
  console.log(`UPDATE users SET pass_hash = '${hash}' WHERE username = 'admin';`);
  console.log();
  console.log('── SQL INSERT completo (novo usuário) ──');
  console.log(`INSERT INTO users (username, email, pass_hash, hash_algo, role, active, workspace, name)`);
  console.log(`VALUES ('admin', 'admin@agrovisita.com.br', '${hash}', 'bcrypt', 'admin', true, 'principal', 'Administrador')`);
  console.log(`ON CONFLICT (username) DO UPDATE SET pass_hash = EXCLUDED.pass_hash;`);
  console.log();
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Uso: node scripts/generate-password-hash.js <senha>');
  console.error('Ex : node scripts/generate-password-hash.js admin123');
  process.exit(1);
}

generateHash(args[0]).catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
