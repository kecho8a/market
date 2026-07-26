// Direct PostgreSQL connection to Supabase
// Run: npx tsx tests/supabase-migrate.ts

import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || '';
const DB_HOST = process.env.SUPABASE_DB_HOST || 'db.gqhanfjhqfeqsgpscmet.supabase.co';

if (!DB_PASSWORD) {
  console.error('Falta SUPABASE_DB_PASSWORD en .env');
  process.exit(1);
}

async function main() {
  console.log('🔌 Conectando a Supabase PostgreSQL...\n');

  const configs = [
    { host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: `postgres.${DB_HOST.replace('db.', '').replace('.supabase.co', '')}`, database: 'postgres' },
    { host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: 'postgres', database: 'postgres' },
    { host: DB_HOST, port: 5432, user: 'postgres', database: 'postgres' },
  ];

  let client: Client | null = null;

  for (const config of configs) {
    try {
      console.log(`   Intentando: ${config.user}@${config.host}:${config.port}`);
      const testClient = new Client({
        ...config,
        password: DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      await testClient.connect();
      console.log(`   ✅ ¡Conectado!\n`);
      client = testClient;
      break;
    } catch (e: any) {
      console.log(`   ❌ ${e.message.substring(0, 100)}\n`);
    }
  }

  if (!client) {
    console.error('❌ No se pudo conectar. Ejecuta el SQL manualmente en Supabase SQL Editor.');
    console.log('   Archivo: tests/migration.sql');
    process.exit(1);
  }

  try {
    const ver = await client.query('SELECT version()');
    console.log(`📊 ${ver.rows[0].version}\n`);

    // MIGRATION 1: service_role permissions
    console.log('═══ MIGRATION 1: Permisos service_role ═══');
    for (const sql of [
      'GRANT USAGE ON SCHEMA public TO service_role',
      'GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role',
      'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role',
    ]) {
      try { await client.query(sql); console.log(`✅ ${sql.substring(0, 50)}...`); }
      catch (e: any) { console.log(`⚠️  ${e.message.substring(0, 80)}`); }
    }

    // MIGRATION 2: role column
    console.log('\n═══ MIGRATION 2: Columna role ═══');
    try {
      await client.query("ALTER TABLE usuarios_clientes ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'cliente'");
      console.log('✅ Columna "role" agregada');
    } catch (e: any) { console.log(`⚠️  ${e.message.substring(0, 80)}`); }

    // MIGRATION 3: Auth functions
    console.log('\n═══ MIGRATION 3: Funciones de autorización ═══');
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION public.is_superadmin()
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN (auth.jwt()->'app_metadata'->>'role' = 'superadmin')
              OR (auth.jwt()->>'email' = 'sugolo28@gmail.com');
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
      `);
      console.log('✅ is_superadmin() creada');
    } catch (e: any) { console.log(`⚠️  ${e.message.substring(0, 80)}`); }

    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN public.is_superadmin()
              OR (auth.jwt()->'app_metadata'->>'role' = 'admin')
              OR (auth.jwt()->>'email' = 'kecho8a@gmail.com');
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
      `);
      console.log('✅ is_admin_or_superadmin() creada');
    } catch (e: any) { console.log(`⚠️  ${e.message.substring(0, 80)}`); }

    // MIGRATION 4: RLS policies
    console.log('\n═══ MIGRATION 4: RLS Policies ═══');
    const policies = [
      { name: 'store_config admin', sql: `DROP POLICY IF EXISTS "Allow all updates only to admin" ON store_config; CREATE POLICY "Allow all updates only to admin" ON store_config FOR ALL TO authenticated USING (public.is_admin_or_superadmin());` },
      { name: 'products lectura', sql: `DROP POLICY IF EXISTS "Lectura productos activos" ON products; CREATE POLICY "Lectura productos activos" ON products FOR SELECT USING (activo = true OR public.is_admin_or_superadmin());` },
      { name: 'products admin', sql: `DROP POLICY IF EXISTS "Allow admin changes to catalog" ON products; CREATE POLICY "Allow admin changes to catalog" ON products FOR ALL TO authenticated USING (public.is_admin_or_superadmin()) WITH CHECK (public.is_admin_or_superadmin());` },
      { name: 'orders select', sql: `DROP POLICY IF EXISTS "orders_select_own_or_admin" ON orders; CREATE POLICY "orders_select_own_or_admin" ON orders FOR SELECT USING (auth.uid()::text = cliente_uid OR public.is_admin_or_superadmin());` },
      { name: 'orders update', sql: `DROP POLICY IF EXISTS "orders_update_admin" ON orders; CREATE POLICY "orders_update_admin" ON orders FOR ALL TO authenticated USING (public.is_admin_or_superadmin()) WITH CHECK (public.is_admin_or_superadmin());` },
      { name: 'usuarios admin select', sql: `DROP POLICY IF EXISTS "Admin lee todos los clientes" ON usuarios_clientes; CREATE POLICY "Admin lee todos los clientes" ON usuarios_clientes FOR SELECT TO authenticated USING (public.is_admin_or_superadmin());` },
      { name: 'usuarios admin all', sql: `DROP POLICY IF EXISTS "Admin gestiona todos los clientes" ON usuarios_clientes; CREATE POLICY "Admin gestiona todos los clientes" ON usuarios_clientes FOR ALL TO authenticated USING (public.is_admin_or_superadmin()) WITH CHECK (public.is_admin_or_superadmin());` },
      { name: 'notifications select', sql: `DROP POLICY IF EXISTS "Lectura de notificaciones" ON notifications; CREATE POLICY "Lectura de notificaciones" ON notifications FOR SELECT TO anon, authenticated USING (tipo = 'todos' OR (tipo = 'admin' AND public.is_admin_or_superadmin()) OR (tipo = 'personal' AND destinatario_telefono IS NOT NULL AND destinatario_telefono != '') OR (tipo = 'request' AND public.is_admin_or_superadmin()));` },
      { name: 'coupons admin', sql: `DROP POLICY IF EXISTS "Gestion cupones admin" ON coupons; CREATE POLICY "Gestion cupones admin" ON coupons FOR ALL TO authenticated USING (public.is_admin_or_superadmin()) WITH CHECK (public.is_admin_or_superadmin());` },
    ];
    for (const p of policies) {
      try { await client.query(p.sql); console.log(`✅ ${p.name}`); }
      catch (e: any) { console.log(`⚠️  ${p.name}: ${e.message.substring(0, 80)}`); }
    }

    // MIGRATION 5: Clean webhook secret
    console.log('\n═══ MIGRATION 5: Limpiar webhook secret ═══');
    try {
      await client.query(`UPDATE store_config SET push_webhook_secret = '' WHERE push_webhook_secret = '5fca5a4d8825d4de66811590f47af870b01d45e80f391920f4ea76a59ae3c8bf'`);
      console.log('✅ Webhook secret eliminado');
    } catch (e: any) { console.log(`⚠️  ${e.message.substring(0, 80)}`); }

    // VERIFICATION
    console.log('\n═══ VERIFICACIÓN ═══\n');
    try {
      const { rows } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios_clientes' AND column_name = 'role'`);
      console.log(`✅ Columna role: ${rows.length > 0 ? 'EXISTS' : 'MISSING'}`);
    } catch (e: any) { console.log(`⚠️  ${e.message.substring(0, 60)}`); }

    try {
      const { rows } = await client.query(`SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('is_superadmin', 'is_admin_or_superadmin')`);
      console.log(`✅ Funciones: ${rows.map(r => r.routine_name).join(', ')}`);
    } catch (e: any) { console.log(`⚠️  ${e.message.substring(0, 60)}`); }

    try {
      const { rows } = await client.query(`SELECT has_schema_privilege('service_role', 'public', 'USAGE') as ok`);
      console.log(`✅ service_role USAGE: ${rows[0]?.ok ? 'YES' : 'NO'}`);
    } catch (e: any) { console.log(`⚠️  ${e.message.substring(0, 60)}`); }

    try {
      const { rows } = await client.query(`SELECT count(*) as total FROM pg_policies WHERE schemaname = 'public'`);
      console.log(`✅ Total policies RLS: ${rows[0].total}`);
    } catch (e: any) { console.log(`⚠️  ${e.message.substring(0, 60)}`); }

    console.log('\n🎯 MIGRACIÓN COMPLETADA');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada.');
  }
}

main();
