// Direct REST API check for Supabase
// Uses fetch instead of client library

const SUPABASE_URL = 'https://gqhanfjhqfeqsgpscmet.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaGFuZmpocWZlcXNncHNjbWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIzMzEyOSwiZXhwIjoyMDk0ODA5MTI5fQ.zVOk9zqT6xFROwhp9wpb74ERfO1T0pUM_eabYuQ93i8';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaGFuZmpocWZlcXNncHNjbWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzMxMjksImV4cCI6MjA5NDgwOTEyOX0.WkO1pwDH8uTV--wmOcDL-Bz73ZOZT50dyc2-cAN6Cew';

async function queryTable(table: string, key: string, select = '*', limit = 100) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `${res.status}: ${text}`, data: null };
  }
  const data = await res.json();
  return { error: null, data };
}

async function countTable(table: string, key: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=count`;
  const res = await fetch(url, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact'
    }
  });
  const count = res.headers.get('content-range');
  if (count) {
    const match = count.match(/\/(\d+)/);
    if (match) return { error: null, count: parseInt(match[1]) };
  }
  return { error: `Status ${res.status}`, count: null };
}

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   MARKETO - VERIFICACIÓN REST API          ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Test with anon key first (public data)
  console.log('═══ CON ANON KEY ( datos públicos ) ═══\n');

  const anonTables = ['store_config', 'products', 'notifications'];
  for (const table of anonTables) {
    const { data, error } = await queryTable(table, ANON_KEY, '*', 3);
    if (error) {
      console.log(`❌ ${table}: ${error}`);
    } else {
      console.log(`✅ ${table}: ${data?.length} registros`);
      if (data && data.length > 0) {
        console.log(`   Ejemplo:`, JSON.stringify(data[0]).substring(0, 200));
      }
    }
  }

  // Test with service role key (all data)
  console.log('\n═══ CON SERVICE ROLE KEY ( todos los datos ) ═══\n');

  const allTables = ['store_config', 'usuarios_clientes', 'products', 'orders', 'push_subscriptions', 'coupons', 'notifications'];
  for (const table of allTables) {
    const { data, error } = await queryTable(table, SERVICE_ROLE_KEY, '*', 3);
    if (error) {
      console.log(`❌ ${table}: ${error}`);
    } else {
      console.log(`✅ ${table}: ${data?.length} registros`);
      if (data && data.length > 0) {
        console.log(`   Ejemplo:`, JSON.stringify(data[0]).substring(0, 300));
      }
    }
  }

  // Count all tables
  console.log('\n═══ CONTEO COMPLETO ═══\n');
  for (const table of allTables) {
    const { count, error } = await countTable(table, SERVICE_ROLE_KEY);
    if (error) {
      console.log(`❌ ${table}: ${error}`);
    } else {
      console.log(`✅ ${table}: ${count} registros`);
    }
  }

  // Test RPC functions
  console.log('\n═══ FUNCIONES RPC ═══\n');
  const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/get_all_push_subscriptions`;
  const rpcRes = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  const rpcData = await rpcRes.json();
  if (!rpcRes.ok) {
    console.log(`❌ get_all_push_subscriptions: ${rpcRes.status} - ${JSON.stringify(rpcData)}`);
  } else {
    console.log(`✅ get_all_push_subscriptions: ${(rpcData as any[]).length} suscripciones`);
    if ((rpcData as any[]).length > 0) {
      console.log(`   Ejemplo:`, JSON.stringify(rpcData[0]).substring(0, 200));
    }
  }

  // Check store_config detail
  console.log('\n═══ STORE CONFIG DETALLE ═══\n');
  const { data: cfg } = await queryTable('store_config', SERVICE_ROLE_KEY, 'id,site_nombre,push_webhook_url,tasa_cambio,esta_abierta,push_webhook_secret', 1);
  if (cfg && cfg.length > 0) {
    const c = cfg[0] as any;
    console.log(`   Tienda: ${c.site_nombre}`);
    console.log(`   Tasa cambio: ${c.tasa_cambio}`);
    console.log(`   Abierta: ${c.esta_abierta}`);
    console.log(`   Webhook URL: ${c.push_webhook_url}`);
    console.log(`   Webhook Secret: ${c.push_webhook_secret ? `${c.push_webhook_secret.length} chars` : 'NO CONFIGURADO'}`);
  }

  // Check recent orders
  console.log('\n═══ ÚLTIMAS ÓRDENES ═══\n');
  const { data: orders } = await queryTable('orders', SERVICE_ROLE_KEY, 'id,status,total_usd,cliente_nombre,created_at', 5);
  if (orders && orders.length > 0) {
    for (const o of orders) {
      console.log(`   ${(o as any).id} | ${(o as any).status} | $${(o as any).total_usd} | ${(o as any).cliente_nombre} | ${(o as any).created_at}`);
    }
  } else {
    console.log('   No hay órdenes registradas');
  }

  // Check products with stock issues
  console.log('\n═══ PRODUCTOS SIN STOCK ═══\n');
  const { data: noStock } = await queryTable('products', SERVICE_ROLE_KEY, 'id,nombre,stock,activo', 50);
  if (noStock) {
    const outOfStock = noStock.filter((p: any) => p.stock <= 0 && p.activo);
    console.log(`   ${outOfStock.length} productos activos sin stock`);
    for (const p of outOfStock.slice(0, 5)) {
      console.log(`   ❌ ${p.nombre} (stock: ${p.stock})`);
    }
  }

  // Check push subscriptions
  console.log('\n═══ SUSCRIPCIONES PUSH ═══\n');
  const { data: subs } = await queryTable('push_subscriptions', SERVICE_ROLE_KEY, 'id,endpoint,destinatario_telefono,anonymous_id,created_at', 20);
  if (subs && subs.length > 0) {
    console.log(`   ${subs.length} suscripciones:`);
    for (const s of subs) {
      const sub = s as any;
      console.log(`   - ${sub.id.substring(0, 8)}... | Tel: ${sub.destinatario_telefono || 'N/A'} | Anon: ${sub.anonymous_id?.substring(0, 8) || 'N/A'}`);
    }
  } else {
    console.log('   No hay suscripciones push');
  }

  // Check notifications
  console.log('\n═══ NOTIFICACIONES ═══\n');
  const { data: notifs } = await queryTable('notifications', SERVICE_ROLE_KEY, 'id,titulo,tipo,leida,created_at', 10);
  if (notifs && notifs.length > 0) {
    console.log(`   ${notifs.length} notificaciones:`);
    for (const n of notifs) {
      const notif = n as any;
      console.log(`   - ${notif.titulo} | Tipo: ${notif.tipo} | Leída: ${notif.leida}`);
    }
  } else {
    console.log('   No hay notificaciones');
  }
}

main().catch(console.error);
