const { Pool } = require('pg');

const PASSWORD = 'Ochoa12474252';
const REF = 'gqhanfjhqfeqsgpscmet';

// Supabase new pooler requires SNI. Try with sslmode=require and ssl hostname
const pool = new Pool({
  connectionString: `postgresql://postgres:${PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  ssl: { 
    rejectUnauthorized: false,
    servername: `${REF}.supabase.co`  // SNI hostname
  },
  connectionTimeoutMillis: 15000,
  family: 4,
});

async function run() {
  try {
    const client = await pool.connect();
    console.log('Connected!');
    const result = await client.query('SELECT version()');
    console.log(`DB version: ${result.rows[0].version}`);
    
    // Execute migration
    const fs = require('fs');
    const sql = fs.readFileSync('tests/migration_club_coupons.sql', 'utf8');
    await client.query(sql);
    console.log('Migration executed successfully!');
    
    client.release();
    await pool.end();
  } catch (e) {
    console.log(`Failed: ${e.message}`);
    await pool.end().catch(() => {});
  }
}

run();
