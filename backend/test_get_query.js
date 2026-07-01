import { getQuery } from './database.js';

async function test() {
  const user = await getQuery('SELECT * FROM users WHERE email = ?', ['admin@mrphotographer.com']);
  console.log(user);
  process.exit(0);
}
test();
