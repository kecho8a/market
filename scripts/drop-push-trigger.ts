// Script para eliminar el trigger duplicado de push notifications en Supabase
// Ejecutar: npx tsx scripts/drop-push-trigger.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gqhanfjhqfeqsgpscmet.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaGFuZmpocWZlcXNncHNjbWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIzMzEyOSwiZXhwIjoyMDk0ODA5MTI5fQ.zVOk9zqT6xFROwhp9wpb74ERfO1T0pUM_eabYuQ93i8';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  console.log('🔍 Verificando estado del sistema de push notifications...\n');

  // Verify current push subscriptions state
  console.log('📊 Estado actual de push_subscriptions:');
  const { data: subs, count, error: subsErr } = await supabase.from('push_subscriptions').select('*', { count: 'exact' }).limit(5);
  if (subsErr) {
    console.log('Error:', subsErr.message);
  } else {
    console.log(`Total suscripciones: ${count}`);
    if (subs && subs.length > 0) {
      const withPhone = subs.filter(s => s.destinatario_telefono && s.destinatario_telefono.trim() !== '');
      const withoutPhone = subs.filter(s => !s.destinatario_telefono || s.destinatario_telefono.trim() === '');
      console.log(`Con teléfono: ${withPhone.length} de ${subs.length} (muestra)`);
      console.log(`Sin teléfono: ${withoutPhone.length} de ${subs.length} (muestra)`);
      if (withPhone.length > 0) {
        withPhone.forEach(s => console.log(`  ✅ ${s.anonymous_id || 'no-id'} → ${s.destinatario_telefono}`));
      }
    }
  }

  console.log('\n📋 PARA ELIMINAR EL TRIGGER DUPLICADO:');
  console.log('═══════════════════════════════════════════════');
  console.log('Ve al SQL Editor de Supabase (Dashboard) y ejecuta:');
  console.log('');
  console.log('DROP TRIGGER IF EXISTS trigger_notify_push ON public.notifications;');
  console.log('DROP FUNCTION IF EXISTS public.handle_new_notification_push();');
  console.log('═══════════════════════════════════════════════');
}

main().catch(console.error);
