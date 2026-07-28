const https = require('https');

const SUPABASE_URL = 'https://gqhanfjhqfeqsgpscmet.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaGFuZmpocWZlcXNncHNjbWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIzMzEyOSwiZXhwIjoyMDk0ODA5MTI5fQ.zVOk9zqT6xFROwhp9wpb74ERfO1T0pUM_eabYuQ93i8';

function apiRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      path: url.pathname,
      method: method,
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0
      }
    };
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== Eliminando trigger duplicado de push notifications ===\n');

  // Try using the Supabase SQL endpoint (available in some plans)
  console.log('Intento 1: Verificar via RPC...');
  try {
    const r1 = await apiRequest('/rest/v1/rpc/exec_sql', 'POST', {
      query: "SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'trigger_notify_push'"
    });
    console.log('exec_sql result:', r1.status, JSON.stringify(r1.data).substring(0, 200));
  } catch(e) {
    console.log('exec_sql no disponible:', e.message);
  }

  // Try the pg_net approach - call a SQL function via RPC
  console.log('\nIntento 2: Verificar triggers via information_schema...');
  try {
    const r2 = await apiRequest('/rest/v1/information_schema.triggers?select=trigger_name&trigger_name=eq.trigger_notify_push', 'GET');
    console.log('information_schema result:', r2.status, JSON.stringify(r2.data).substring(0, 200));
  } catch(e) {
    console.log('information_schema query failed:', e.message);
  }

  // Try via Supabase's /sql endpoint (available with service role)
  console.log('\nIntento 3: SQL directo via /sql endpoint...');
  try {
    const r3 = await apiRequest('/sql', 'POST', {
      query: "SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'trigger_notify_push'"
    });
    console.log('/sql result:', r3.status, JSON.stringify(r3.data).substring(0, 500));
  } catch(e) {
    console.log('/sql endpoint failed:', e.message);
  }

  console.log('\n=== RESULTADO ===');
  console.log('No se pudo ejecutar SQL directo desde esta máquina (DNS/IPv6 issue).');
  console.log('Ejecuta el SQL manualmente en Supabase Dashboard > SQL Editor:');
  console.log('');
  console.log('DROP TRIGGER IF EXISTS trigger_notify_push ON public.notifications;');
  console.log('DROP FUNCTION IF EXISTS public.handle_new_notification_push();');
}

main().catch(console.error);
