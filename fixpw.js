const { Client } = require('pg');
const argon2 = require('argon2');

(async () => {
  const hash = await argon2.hash('Edina2024!');
  console.log('Hash:', hash.substring(0, 30), '...');

  const client = new Client({
    host: 'localhost',
    database: 'edina_prod',
    user: 'edina',
    password: 'edina_prod_Ua9kQ2m'
  });
  await client.connect();

  const res = await client.query(
    "UPDATE users SET password_hash = $1 WHERE email = 'spandou1@gmail.com' RETURNING id, email",
    [hash]
  );
  console.log('Updated:', res.rows);

  const check = await client.query(
    "SELECT password_hash FROM users WHERE email = 'spandou1@gmail.com'"
  );
  console.log('Match:', check.rows[0].password_hash === hash);

  await client.end();
})();
