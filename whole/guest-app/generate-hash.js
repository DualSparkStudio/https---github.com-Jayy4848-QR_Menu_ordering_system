const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nRun this SQL in Supabase:');
console.log(`UPDATE "Staff" SET "passwordHash" = '${hash}' WHERE email = 'admin@thefork.com';`);
