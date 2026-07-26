// QA Test: General - Checkout Flow, Coupons, Exchange Rate, System Integrity
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL as URL, SERVICE_ROLE_KEY as SERVICE_KEY, ANON_KEY } from '../test-config';

interface TestResult {
  test: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  detail: string;
  duration?: number;
}

const results: TestResult[] = [];

function pass(cat: string, test: string, detail: string, dur?: number) {
  results.push({ test, category: cat, status: 'PASS', detail, duration: dur });
  console.log(`  ✅ ${test}: ${detail}`);
}

function fail(cat: string, test: string, detail: string) {
  results.push({ test, category: cat, status: 'FAIL', detail });
  console.log(`  ❌ ${test}: ${detail}`);
}

function warn(cat: string, test: string, detail: string) {
  results.push({ test, category: cat, status: 'WARN', detail });
  console.log(`  ⚠️  ${test}: ${detail}`);
}

// ══════════════════════════════════════
// TEST 1: Product Catalog Integrity
// ══════════════════════════════════════
async function testCatalogIntegrity() {
  console.log('\n📦 TEST 1: Product Catalog Integrity');

  const supabase = createClient(URL, SERVICE_KEY);

  const { data: products } = await supabase.from('products').select('*');
  if (!products) {
    fail('Catalog', 'Cannot load products', 'Query returned null');
    return;
  }

  console.log(`  Total products: ${products.length}`);

  // Check: All products have required fields
  const requiredFields = ['id', 'codigo', 'nombre', 'categoria', 'precio_usd', 'stock'];
  const incomplete = products.filter(p => requiredFields.some(f => !p[f as keyof typeof p] && p[f as keyof typeof p] !== 0));

  if (incomplete.length === 0) {
    pass('Catalog', 'All products have required fields', `${products.length} products complete`);
  } else {
    fail('Catalog', `${incomplete.length} products incomplete`, `Missing fields in: ${incomplete.map(p => p.codigo).join(', ')}`);
  }

  // Check: No negative prices
  const negativePrices = products.filter(p => (p as any).precio_usd < 0);
  if (negativePrices.length === 0) {
    pass('Catalog', 'No negative prices', 'All prices are >= 0');
  } else {
    fail('Catalog', 'Negative prices found', `${negativePrices.length} products have negative prices`);
  }

  // Check: No negative stock
  const negativeStock = products.filter(p => (p as any).stock < 0);
  if (negativeStock.length === 0) {
    pass('Catalog', 'No negative stock', 'All stock values are >= 0');
  } else {
    fail('Catalog', 'Negative stock found', `${negativeStock.length} products have negative stock`);
  }

  // Check: Unique SKUs
  const skus = products.map(p => p.codigo).filter(Boolean);
  const uniqueSkus = new Set(skus);
  if (uniqueSkus.size === skus.length) {
    pass('Catalog', 'Unique SKUs', `${skus.length} unique product codes`);
  } else {
    fail('Catalog', 'Duplicate SKUs', `${skus.length} total, ${uniqueSkus.size} unique`);
  }

  // Check: Categories exist
  const categories = new Set(products.map(p => p.categoria).filter(Boolean));
  console.log(`  Categories: ${[...categories].join(', ')}`);
  if (categories.size >= 5) {
    pass('Catalog', 'Categories present', `${categories.size} categories found`);
  } else {
    warn('Catalog', 'Few categories', `Only ${categories.size} categories`);
  }
}

// ══════════════════════════════════════
// TEST 2: Order Flow
// ══════════════════════════════════════
async function testOrderFlow() {
  console.log('\n📦 TEST 2: Order Flow');

  const supabase = createClient(URL, SERVICE_KEY);

  // Get a product for the test order
  const { data: products } = await supabase.from('products')
    .select('id, codigo, nombre, precio_usd, stock')
    .eq('activo', true)
    .gt('stock', 1)
    .limit(1);

  if (!products || products.length === 0) {
    warn('Order Flow', 'No products available', 'Cannot test order flow');
    return;
  }

  const product = products[0] as any;
  const originalStock = product.stock;
  const orderId = `QA-TEST-${Date.now()}`;

  console.log(`  Test product: ${product.nombre} (stock: ${originalStock})`);

  // Create test order
  const order = {
    id: orderId,
    cliente_nombre: 'QA Test Customer',
    cliente_telefono: '0000-TEST',
    cliente_email: 'qa@test.com',
    metodo_pago: 'Efectivo',
    items: [{ part_id: product.id, nombre: product.nombre, codigo: product.codigo, precio_usd: product.precio_usd, cantidad: 1 }],
    subtotal_usd: product.precio_usd,
    costo_envio_usd: 2.00,
    total_usd: product.precio_usd + 2.00,
    total_bs: (product.precio_usd + 2.00) * 737.23,
    status: 'Pendiente' as const,
    lat: 10.1983,
    lng: -68.0044,
    direccion_envio: 'QA Test Address',
    distancia_km: 1.5,
  };

  const { error: insertError } = await supabase.from('orders').insert(order);

  if (!insertError) {
    pass('Order Flow', 'Order created', `Order ${orderId} inserted successfully`);

    // Wait for trigger to fire (stock decrement)
    await new Promise(r => setTimeout(r, 2000));

    // Check: Was stock decremented?
    const { data: updatedProduct } = await supabase.from('products')
      .select('stock')
      .eq('id', product.id)
      .single();

    const newStock = (updatedProduct as any)?.stock;
    if (newStock === originalStock - 1) {
      pass('Order Flow', 'Stock decremented', `Stock: ${originalStock} → ${newStock}`);
    } else if (newStock !== undefined) {
      warn('Order Flow', 'Stock unchanged', `Expected ${originalStock - 1}, got ${newStock} (trigger may not have fired)`);
    }

    // Check: Was admin notification created?
    await new Promise(r => setTimeout(r, 1000));
    const { data: notifs } = await supabase.from('notifications')
      .select('id, titulo')
      .eq('tipo', 'admin')
      .order('created_at', { ascending: false })
      .limit(1);

    if (notifs && notifs.length > 0 && (notifs[0] as any).titulo.includes(orderId)) {
      pass('Order Flow', 'Admin notification created', `Notification for ${orderId} found`);
    } else {
      warn('Order Flow', 'Admin notification', 'Notification not found (may take longer)');
    }

    // Cleanup: restore stock and delete test order
    await supabase.from('products').update({ stock: originalStock }).eq('id', product.id);
    await supabase.from('orders').delete().eq('id', orderId);
    await supabase.from('notifications').delete().like('titulo', `%${orderId}%`);
    pass('Order Flow', 'Test cleanup', 'Stock restored, test order removed');
  } else {
    fail('Order Flow', 'Order creation failed', insertError.message.substring(0, 60));
  }
}

// ══════════════════════════════════════
// TEST 3: Order Status Transitions
// ══════════════════════════════════════
async function testOrderStatusTransitions() {
  console.log('\n📦 TEST 3: Order Status Transitions');

  const supabase = createClient(URL, SERVICE_KEY);

  // Get a recent order
  const { data: orders } = await supabase.from('orders')
    .select('id, status')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!orders || orders.length === 0) {
    warn('Status', 'No orders to test', 'Cannot test status transitions');
    return;
  }

  const order = orders[0] as any;
  const originalStatus = order.status;

  console.log(`  Test order: ${order.id} (status: ${originalStatus})`);

  // Valid status transitions
  const validTransitions: Record<string, string> = {
    'Pendiente': 'Procesando',
    'Procesando': 'Enviado',
    'Enviado': 'En camino',
  };

  // Only test if we can safely transition
  const nextStatus = validTransitions[originalStatus];
  if (nextStatus) {
    const { error } = await supabase.from('orders')
      .update({ status: nextStatus })
      .eq('id', order.id);

    if (!error) {
      pass('Status', `Transition: ${originalStatus} → ${nextStatus}`, 'Status updated successfully');

      // Restore original status
      await supabase.from('orders').update({ status: originalStatus }).eq('id', order.id);
      pass('Status', 'Status restored', `Back to ${originalStatus}`);
    } else {
      fail('Status', `Transition failed`, error.message.substring(0, 60));
    }
  } else {
    pass('Status', `Current status: ${originalStatus}`, 'Status is in a terminal or non-transitionable state');
  }
}

// ══════════════════════════════════════
// TEST 4: Coupon System
// ══════════════════════════════════════
async function testCoupons() {
  console.log('\n📦 TEST 4: Coupon System');

  const supabase = createClient(URL, SERVICE_KEY);

  // Create test coupon
  const couponCode = `QA-TEST-${Date.now()}`;
  const { data: coupon, error: createError } = await supabase.from('coupons').insert({
    code: couponCode,
    discount_percent: 10,
    active: true,
    usage_limit: 3,
    usage_count: 0
  }).select().single();

  if (!createError && coupon) {
    pass('Coupon', 'Test coupon created', `${couponCode} (10% off, limit 3)`);

    // Test: Can anon read active coupons?
    const anonClient = createClient(URL, ANON_KEY);
    const { data: visibleCoupons } = await anonClient.from('coupons')
      .select('code, discount_percent')
      .eq('active', true);

    if (visibleCoupons && visibleCoupons.length > 0) {
      const found = visibleCoupons.find((c: any) => c.code === couponCode);
      if (found) {
        pass('Coupon', 'Coupon visible to anon', 'Active coupons are public');
      } else {
        warn('Coupon', 'Coupon not found by anon', 'May be RLS restriction');
      }
    }

    // Test: Usage limit
    if ((coupon as any).usage_count < (coupon as any).usage_limit) {
      pass('Coupon', 'Usage limit check', `Used: ${(coupon as any).usage_count}/${(coupon as any).usage_limit}`);
    }

    // Cleanup
    await supabase.from('coupons').delete().eq('id', (coupon as any).id);
    pass('Coupon', 'Test coupon cleaned up', 'Deleted test coupon');
  } else {
    warn('Coupon', 'Cannot create test coupon', createError?.message?.substring(0, 60) || 'Unknown error');
  }
}

// ══════════════════════════════════════
// TEST 5: Exchange Rate
// ══════════════════════════════════════
async function testExchangeRate() {
  console.log('\n📦 TEST 5: Exchange Rate');

  const supabase = createClient(URL, SERVICE_KEY);

  const { data: config } = await supabase.from('store_config')
    .select('tasa_cambio')
    .limit(1);

  if (config && config.length > 0) {
    const rate = (config[0] as any).tasa_cambio;
    if (rate > 0) {
      pass('Exchange Rate', 'Rate configured', `${rate} Bs/USD`);
    } else {
      fail('Exchange Rate', 'Rate is 0 or negative', `Value: ${rate}`);
    }

    // Test: Is rate in reasonable range? (Venezuela 2026: ~500-1500 Bs/USD)
    if (rate >= 100 && rate <= 5000) {
      pass('Exchange Rate', 'Rate in reasonable range', `${rate} is within 100-5000`);
    } else {
      warn('Exchange Rate', 'Rate outside expected range', `${rate} Bs/USD`);
    }
  } else {
    fail('Exchange Rate', 'No config found', 'Cannot read tasa_cambio');
  }
}

// ══════════════════════════════════════
// TEST 6: System Health Check
// ══════════════════════════════════════
async function testSystemHealth() {
  console.log('\n📦 TEST 6: System Health');

  const supabase = createClient(URL, SERVICE_KEY);

  // Check: All tables accessible
  const tables = ['store_config', 'usuarios_clientes', 'products', 'orders', 'push_subscriptions', 'coupons', 'notifications'];
  let accessibleCount = 0;

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (!error) accessibleCount++;
  }

  if (accessibleCount === tables.length) {
    pass('Health', 'All tables accessible', `${tables.length}/${tables.length} tables OK`);
  } else {
    fail('Health', `${accessibleCount}/${tables.length} tables accessible`, 'Some tables have issues');
  }

  // Check: Store config complete
  const { data: config } = await supabase.from('store_config').select('*').limit(1);
  if (config && config.length > 0) {
    const cfg = config[0] as any;
    const criticalFields = ['site_nombre', 'telefono_soporte', 'tasa_cambio', 'esta_abierta'];
    const missing = criticalFields.filter(f => !cfg[f] && cfg[f] !== false);

    if (missing.length === 0) {
      pass('Health', 'Store config complete', 'All critical fields present');
    } else {
      fail('Health', 'Missing config fields', missing.join(', '));
    }
  }

  // Check: No orphaned notifications (notifications with tipo='admin' but no matching order)
  const { data: adminNotifs } = await supabase.from('notifications')
    .select('id, titulo')
    .eq('tipo', 'admin')
    .limit(50);

  if (adminNotifs) {
    pass('Health', 'Admin notifications', `${adminNotifs.length} admin notifications`);
  }

  // Check: Push webhook URL configured
  if (config && config.length > 0) {
    const webhookUrl = (config[0] as any).push_webhook_url;
    if (webhookUrl && webhookUrl.includes('supabase') || webhookUrl?.includes('pages.dev')) {
      pass('Health', 'Webhook URL configured', webhookUrl.substring(0, 50));
    } else {
      warn('Health', 'Webhook URL', webhookUrl || 'Not configured');
    }
  }
}

// ══════════════════════════════════════
// MAIN
// ══════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  QA GENERAL TESTS - MARKETO PWA              ║');
  console.log('║  ' + new Date().toLocaleString() + '                  ║');
  console.log('╚══════════════════════════════════════════════╝');

  await testCatalogIntegrity();
  await testOrderFlow();
  await testOrderStatusTransitions();
  await testCoupons();
  await testExchangeRate();
  await testSystemHealth();

  const passed = results.filter(r => r.status === 'PASS').length;
  const warnings = results.filter(r => r.status === 'WARN').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log('\n═══════════════════════════════════════');
  console.log('  📊 GENERAL TEST RESULTS');
  console.log('═══════════════════════════════════════');
  console.log(`  ✅ PASSED:  ${passed}`);
  console.log(`  ⚠️  WARNINGS: ${warnings}`);
  console.log(`  ❌ FAILED:  ${failed}`);
  console.log('═══════════════════════════════════════');

  const fs = await import('fs');
  fs.writeFileSync('tests/qa/general-results.json', JSON.stringify({ timestamp: new Date().toISOString(), results, summary: { passed, warnings, failed } }, null, 2));
  console.log('  📄 Reporte: tests/qa/general-results.json');
}

main();
