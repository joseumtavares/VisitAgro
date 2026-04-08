const bcrypt = require('bcryptjs');

async function generateHash(password) {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  console.log('\n=== Hash Gerado ===');
  console.log('Senha:', password);
  console.log('Hash:', hash);
  console.log('===================\n');
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Uso: node scripts/generate-password-hash.js <senha>');
  process.exit(1);
}

generateHash(args[0]);