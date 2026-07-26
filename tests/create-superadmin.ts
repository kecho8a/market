import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gqhanfjhqfeqsgpscmet.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaGFuZmpocWZlcXNncHNjbWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIzMzEyOSwiZXhwIjoyMDk0ODA5MTI5fQ.zVOk9zqT6xFROwhp9wpb74ERfO1T0pUM_eabYuQ93i8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const SUPERADMIN_EMAIL = 'sugolo28@gmail.com';
const SUPERADMIN_PASSWORD = 'susa.280';
const ADMIN_EMAIL = 'kecho8a@gmail.com';

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   CREAR/VERIFICAR SUPERADMIN EN AUTH      ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // 1. Listar usuarios existentes en Auth
  console.log('📋 Listando usuarios existentes en Supabase Auth...');
  const { data: existing, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listando usuarios:', listError.message);
    return;
  }

  console.log(`   Encontrados ${existing.users.length} usuarios en Auth:\n`);
  for (const user of existing.users) {
    console.log(`   - ${user.email} | role: ${user.app_metadata?.role || 'none'} | confirmed: ${user.email_confirmed_at ? 'yes' : 'no'}`);
  }

  // 2. Buscar superadmin
  const foundSuper = existing.users.find(u => u.email === SUPERADMIN_EMAIL);
  const foundAdmin = existing.users.find(u => u.email === ADMIN_EMAIL);

  // 3. Crear o actualizar superadmin
  console.log('\n═══ SUPERADMIN ═══');
  if (foundSuper) {
    console.log(`   ✅ Ya existe: ${foundSuper.id}`);
    // Asegurar que tiene el rol correcto
    if (foundSuper.app_metadata?.role !== 'superadmin') {
      console.log('   ⚠️  Actualizando app_metadata.role a "superadmin"...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(foundSuper.id, {
        app_metadata: { role: 'superadmin' }
      });
      if (updateError) {
        console.log(`   ❌ Error actualizando: ${updateError.message}`);
      } else {
        console.log('   ✅ Rol actualizado a superadmin');
      }
    } else {
      console.log('   ✅ Ya tiene rol superadmin');
    }
    // Reenviar confirmación por si acaso
    console.log('   🔑 Reseteando contraseña por si acaso...');
    const { error: resetError } = await supabase.auth.admin.updateUserById(foundSuper.id, {
      password: SUPERADMIN_PASSWORD,
      email_confirm: true
    });
    if (resetError) {
      console.log(`   ⚠️  Reset: ${resetError.message}`);
    } else {
      console.log(`   ✅ Contraseña actualizada a: ${SUPERADMIN_PASSWORD}`);
    }
  } else {
    console.log(`   ❌ NO existe. Creando...`);
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      email_confirm: true,
      app_metadata: { role: 'superadmin' },
      user_metadata: { nombre: 'Superadmin', telefono: '+5800000000001' }
    });
    if (createError) {
      console.log(`   ❌ Error creando: ${createError.message}`);
    } else {
      console.log(`   ✅ Creado: ${data.user?.id}`);
    }
  }

  // 4. Crear o actualizar admin secundario
  console.log('\n═══ ADMIN ═══');
  if (foundAdmin) {
    console.log(`   ✅ Ya existe: ${foundAdmin.id}`);
    if (foundAdmin.app_metadata?.role !== 'admin') {
      console.log('   ⚠️  Actualizando app_metadata.role a "admin"...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(foundAdmin.id, {
        app_metadata: { role: 'admin' }
      });
      if (updateError) {
        console.log(`   ❌ Error actualizando: ${updateError.message}`);
      } else {
        console.log('   ✅ Rol actualizado a admin');
      }
    } else {
      console.log('   ✅ Ya tiene rol admin');
    }
    // Resetear contraseña para que coincida con la esperada
    console.log('   🔑 Reseteando contraseña...');
    const { error: resetPw } = await supabase.auth.admin.updateUserById(foundAdmin.id, {
      password: SUPERADMIN_PASSWORD,
      email_confirm: true
    });
    if (resetPw) {
      console.log(`   ⚠️  Reset: ${resetPw.message}`);
    } else {
      console.log(`   ✅ Contraseña actualizada a: ${SUPERADMIN_PASSWORD}`);
    }
  } else {
    console.log(`   ❌ NO existe. Creando...`);
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      email_confirm: true,
      app_metadata: { role: 'admin' },
      user_metadata: { nombre: 'Admin' }
    });
    if (createError) {
      console.log(`   ❌ Error creando: ${createError.message}`);
    } else {
      console.log(`   ✅ Creado: ${data.user?.id}`);
    }
  }

  // 5. Verificar final
  console.log('\n═══ VERIFICACIÓN FINAL ═══');
  const { data: finalList } = await supabase.auth.admin.listUsers();
  for (const user of finalList?.users || []) {
    if (user.email === SUPERADMIN_EMAIL || user.email === ADMIN_EMAIL) {
      const role = user.app_metadata?.role || 'none';
      const confirmed = user.email_confirmed_at ? 'confirmed' : 'UNCONFIRMED';
      console.log(`   ${user.email} | role: ${role} | ${confirmed}`);
    }
  }

  console.log('\n✅ Listo. Intenta iniciar sesión con estas credenciales:');
  console.log(`   Superadmin: ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD}`);
  console.log(`   Admin: ${ADMIN_EMAIL} / ${SUPERADMIN_PASSWORD}`);
}

main();
