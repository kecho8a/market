const { Pool } = require('pg');
const fs = require('fs');

async function tryConnect(host, port, user, label) {
  const pool = new Pool({
    host,
    port,
    database: 'postgres',
    user,
    password: 'Ochoa12474252',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });
  try {
    const client = await pool.connect();
    console.log(`Connected to ${label}!`);
    const sql = fs.readFileSync('tests/migration_loyalty.sql', 'utf8');
    await client.query(sql);
    console.log('Migration executed successfully!');
    client.release();
    await pool.end();
    return true;
  } catch (e) {
    console.log(`Failed ${label}: ${e.message}`);
    await pool.end().catch(() => {});
    return false;
  }
}

async function run() {
  const ref = 'gqhanfjhqfeqsgpscmet';
  const tries = [
    ['aws-0-us-east-1.pooler.supabase.com', 6543, `postgres.${ref}`, 'pooler-us-east-1'],
    ['aws-0-us-east-1.pooler.supabase.com', 5432, `postgres.${ref}`, 'pooler-us-east-1:5432'],
    ['aws-0-us-east-2.pooler.supabase.com', 6543, `postgres.${ref}`, 'pooler-us-east-2'],
  ];
  for (const [host, port, user, label] of tries) {
    const ok = await tryConnect(host, port, user, label);
    if (ok) return;
  }
  console.log('\nNo se pudo conectar. Necesitas ejecutar el SQL manualmente en Supabase Dashboard > SQL Editor.');
}
run();
