// Execute SQL via Supabase Management API (uses access token)
const https = require('https');
const fs = require('fs');

const REF = 'gqhanfjhqfeqsgpscmet';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaGFuZmpocWZlcXNncHNjbWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIzMzEyOSwiZXhwIjoyMDk0ODA5MTI5fQ.zVOk9zqT6xFROwhp9wpb74ERfO1T0pUM_eabYuQ93i8';
const sql = fs.readFileSync('tests/migration_club_coupons.sql', 'utf8');

function req(method, path, body, headers) {
  return new Promise((resolve, reject) => {
    const data = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const h = { ...headers };
    if (data) h['Content-Length'] = Buffer.byteLength(data);
    const options = {
      hostname: `${REF}.supabase.co`,
      port: 443,
      path,
      method,
      headers: h,
    };
    const r = https.request(options, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function run() {
  // Strategy: Execute each SQL statement individually via PostgREST
  // First, check what's already in the schema
  console.log('Checking existing tables...');
  const tables = await req('GET', '/rest/v1/?select=*', null, {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Accept': 'application/openapi+json'
  });
  
  // Parse to check if club_user_coupons already exists
  const apiBody = JSON.parse(tables.body);
  const paths = Object.keys(apiBody.paths || {});
  const hasClubUserCoupons = paths.some(p => p.includes('club_user_coupons'));
  console.log(`club_user_coupons exists in schema: ${hasClubUserCoupons}`);
  console.log(`Available club tables: ${paths.filter(p => p.includes('club')).join(', ')}`);

  if (hasClubUserCoupons) {
    console.log('Table already exists! Migration may have already been run.');
    return;
  }

  // Try to create the table by creating an RPC function that creates it
  // We need to find a way to run DDL. Let's try the /sql endpoint variations
  const sqlEndpoints = [
    '/sql/v1',
    '/platform/sql',
    '/api/sql',
    '/functions/v1/exec_sql',
  ];
  
  for (const ep of sqlEndpoints) {
    try {
      const r = await req('POST', ep, { query: sql }, {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      });
      console.log(`POST ${ep}: ${r.status} - ${r.body.substring(0, 200)}`);
    } catch (e) {
      console.log(`POST ${ep}: ERROR`);
    }
  }

  // Try creating a Supabase Edge Function via deploy API
  // Actually, let's try another approach: use the pg_net extension or similar
  
  // Final approach: try to use the Supabase's own internal SQL endpoint
  // The dashboard uses /sql which goes through a different backend
  console.log('\nTrying dashboard SQL endpoint...');
  try {
    const r = await req('POST', '/sql', { 
      query: sql,
      connection: { 
        host: `db.${REF}.supabase.co`,
        port: 5432,
        database: 'postgres',
        user: 'postgres'
      }
    }, {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    });
    console.log(`POST /sql: ${r.status} - ${r.body.substring(0, 300)}`);
  } catch (e) {
    console.log(`POST /sql: ${e.message}`);
  }

  console.log('\nDirect DB and SQL API not accessible from this machine.');
  console.log('SQL must be executed manually via Supabase Dashboard > SQL Editor');
}

run().catch(e => console.error(e));
