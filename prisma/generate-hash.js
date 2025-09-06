const bcrypt = require('bcryptjs');

const password = 'admin1234';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nUse this hash in Prisma Studio for the password field.');