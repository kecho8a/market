import { SUPABASE_URL, SERVICE_ROLE_KEY as SERVICE_KEY, ANON_KEY } from './test-config';

async function query(table: string, key: string, select = '*', limit = 5) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=${limit}`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  if (!res.ok) return { error: `${res.status}: ${(await res.text()).substring(0, 100)}`, data: null };
  return { error: null, data: await res.json() };
}

async function main() {
  console.log('═══ VERIFICACIÓN POST-MIGRATION ═══\n');

  // 1. Test service_role access (was 403 before migration)
  console.log('1. SERVICE_ROLE ACCESS:');
  const tables = ['store_config', 'usuarios_clientes', 'products', 'orders', 'push_subscriptions', 'coupons', 'notifications'];
  let allOk = true;
  for (const t of tables) {
    const { data, error } = await query(t, SERVICE_KEY, 'count', 1);
    if (error) { console.log(`   ❌ ${t}: ${error}`); allOk = false; }
    else { console.log(`   ✅ ${t}: accessible`); }
  }

  // 2. Store config details
  console.log('\n2. STORE CONFIG:');
  const { data: cfg } = await query('store_config', SERVICE_KEY, 'id,site_nombre,tasa_cambio,esta_abierta,push_webhook_url,push_webhook_secret', 1);
  if (cfg?.length) {
    const c = cfg[0] as any;
    console.log(`   Tienda: ${c.site_nombre}`);
    console.log(`   Tasa: ${c.tasa_cambio}`);
    console.log(`   Abierta: ${c.esta_abierta}`);
    console.log(`   Webhook URL: ${c.push_webhook_url || 'NO CONFIGURADA'}`);
    console.log(`   Webhook Secret: ${c.push_webhook_secret ? `${c.push_webhook_secret.length} chars ⚠️` : 'VACÍO ✅'}`);
  }

  // 3. Data counts
  console.log('\n3. CONTEO DE DATOS:');
  for (const t of tables) {
    const { data } = await query(t, SERVICE_KEY, 'id', 1000);
    console.log(`   ${t}: ${data?.length ?? '?'} registros`);
  }

  // 4. Users detail
  console.log('\n4. USUARIOS:');
  const { data: users } = await query('usuarios_clientes', SERVICE_KEY, 'id,nombre,email,telefono,role', 20);
  if (users?.length) {
    for (const u of users) {
      console.log(`   ${(u as any).nombre} | ${(u as any).email || 'sin email'} | Rol: ${(u as any).role || 'cliente'}`);
    }
  } else {
    console.log('   No hay usuarios en DB');
  }

  // 5. Push subscriptions
  console.log('\n5. SUSCRIPCIONES PUSH:');
  const { data: subs } = await query('push_subscriptions', SERVICE_KEY, 'id,endpoint,destinatario_telefono,anonymous_id', 20);
  if (subs?.length) {
    console.log(`   ${subs.length} suscripciones:`);
    for (const s of subs) {
      const sub = s as any;
      const ep = sub.endpoint?.substring(0, 50) + '...';
      console.log(`   - Tel: ${sub.destinatario_telefono || 'N/A'} | ${ep}`);
    }
  } else {
    console.log('   No hay suscripciones push');
  }

  // 6. Recent orders
  console.log('\n6. ÚLTIMAS ÓRDENES:');
  const { data: orders } = await query('orders', SERVICE_KEY, 'id,status,total_usd,cliente_nombre,created_at', 5);
  if (orders?.length) {
    for (const o of orders) {
      const order = o as any;
      console.log(`   ${order.id} | ${order.status} | $${order.total_usd} | ${order.cliente_nombre}`);
    }
  } else {
    console.log('   No hay órdenes');
  }

  // 7. Notifications
  console.log('\n7. NOTIFICACIONES:');
  const { data: notifs } = await query('notifications', SERVICE_KEY, 'id,titulo,tipo,leida', 10);
  if (notifs?.length) {
    console.log(`   ${notifs.length} notificaciones:`);
    for (const n of notifs) {
      const notif = n as any;
      console.log(`   - ${notif.titulo} | Tipo: ${notif.tipo} | Leída: ${notif.leida}`);
    }
  } else {
    console.log('   No hay notificaciones');
  }

  // 8. Coupons
  console.log('\n8. CUPONES:');
  const { data: coupons } = await query('coupons', SERVICE_KEY, 'id,code,discount_percent,active,usage_count,usage_limit', 20);
  if (coupons?.length) {
    for (const c of coupons) {
      const cup = c as any;
      console.log(`   ${cup.code} | ${cup.discount_percent}% | Activo: ${cup.active} | Usos: ${cup.usage_count}/${cup.usage_limit || '∞'}`);
    }
  } else {
    console.log('   No hay cupones');
  }

  // 9. Products with low stock
  console.log('\n9. PRODUCTOS SIN STOCK:');
  const { data: prods } = await query('products', SERVICE_KEY, 'id,nombre,stock,activo', 200);
  if (prods?.length) {
    const low = prods.filter((p: any) => p.stock <= 0 && p.activo);
    const ok = prods.filter((p: any) => p.stock > 0 && p.activo);
    console.log(`   Activos con stock: ${ok.length}`);
    console.log(`   Activos sin stock: ${low.length}`);
    for (const p of low.slice(0, 5)) {
      console.log(`   ❌ ${(p as any).nombre} (stock: ${(p as any).stock})`);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(allOk ? '✅ TODAS LAS TABLAS ACCESIBLES CON SERVICE_ROLE' : '⚠️ HAY ERRORES DE ACCESO');
  console.log('═══════════════════════════════════════');
}

main();
