// Cloudflare Pages Function - Web Push Handler
// Location: /functions/api/push-notify.ts
// Handles POST requests to send real web push notifications using web-push library

let webpush: any;

declare const PagesFunction: any;

// GET handler for diagnostics
export const onRequestGet: any = async (context: any) => {
  const { env } = context;

  return new Response(JSON.stringify({
    status: 'ok',
    service: 'push-notify',
    vapidConfigured: !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
    supabaseConfigured: !!(env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)),
    webhookSecretConfigured: !!(env.WEBHOOK_SECRET || env.webhook_secret || env.PUSH_WEBHOOK_SECRET || env.push_webhook_secret || env.AUTH_SECRET || env.auth_secret)
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const onRequestPost: any = async (context: any) => {
  const { request, env } = context;

  // 1. Verificación de Seguridad (flexible)
  const rawAuthHeader = request.headers.get('x-supabase-webhook-secret')
    || request.headers.get('x-webhook-secret')
    || request.headers.get('x-push-webhook-secret')
    || '';
  const authHeader = rawAuthHeader.trim();
  const configuredSecret = [env.WEBHOOK_SECRET, env.webhook_secret, env.PUSH_WEBHOOK_SECRET, env.push_webhook_secret, env.PUSH_SECRET, env.push_secret, env.AUTH_SECRET, env.auth_secret].find(Boolean) || '';

  const hasConfiguredSecret = !!configuredSecret;
  const hasHeader = authHeader.length > 0;

  // Skip auth check if no secret configured (dev mode) or if header is empty and secret exists
  if (hasConfiguredSecret && hasHeader) {
    // Flexible comparison: trim and compare lowercased to avoid whitespace issues
    const normalizedHeader = authHeader.toLowerCase().trim();
    const normalizedSecret = configuredSecret.toLowerCase().trim();
    if (normalizedHeader !== normalizedSecret) {
      console.warn('Unauthorized: secret mismatch', { headerLen: authHeader.length, secretLen: configuredSecret.length });
      return new Response(JSON.stringify({ error: 'Unauthorized', reason: 'secret mismatch' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }


  try {
    // 2. Extraer payload enviado por Supabase
    const payload = await request.json();

    // Handle both Supabase trigger format (with record wrapper) and direct test format
    // Supabase trigger: { type: 'INSERT', table: 'notifications', record: { ... } }
    // Test/direct format: { id: '...', title: '...', body: '...', ... }
    let record = payload.record || payload;
    const isSupabaseFormat = !!payload.record;

    if (!record || typeof record !== 'object') {
      return new Response(JSON.stringify({ error: 'Missing record in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fix: Support both English (title/body) and Spanish (titulo/mensaje) field names
    // Supabase trigger sends title/body, test scripts send titulo/mensaje
    const titulo = record.title || record.titulo || 'Marketo';
    const mensaje = record.body || record.mensaje || '';
    const linkUrl = record.link_url || record.url || '/';

    // 3. Configurar WebPush (VAPID)
    const vapidPublic = env.VAPID_PUBLIC_KEY;
    const vapidPrivate = env.VAPID_PRIVATE_KEY;
    if (!vapidPublic || !vapidPrivate) {
      return new Response(
        JSON.stringify({ error: 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY in env' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Import dinámico de web-push antes de usarlo para evitar ReferenceError en bundling
    if (!webpush) {
      const wpMod = await import('web-push');
      webpush = (wpMod as any).default || wpMod;
    }

    webpush.setVapidDetails(
      'mailto:admin@marketo.com.ve',
      vapidPublic,
      vapidPrivate
    );

    // 4. Conectar con Supabase usando la clave de servicio para evitar bloqueos por RLS
    const supabaseUrl = env.SUPABASE_URL;
    // Bypassear RLS usando la SERVICE_ROLE_KEY, o usar la ANON_KEY como fallback
    const supabaseAnonKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY in env' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Import dinámico para evitar bundling pesado
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Filtrar destinatarios según tipo
    const tipo = record.tipo;
    const destinatarioTelefono = record.destinatario_telefono;

    // Usar RPC get_all_push_subscriptions para eludir RLS (necesario para leer todas las suscripciones)
    let subscriptionsRaw: any[] = [];
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_all_push_subscriptions');
      if (rpcErr) {
        console.error('DEBUG RPC error:', JSON.stringify(rpcErr));
      }
      subscriptionsRaw = data || [];
    } catch (rpcCatch: any) {
      console.error('DEBUG RPC catch:', rpcCatch.message);
    }

    // Aplicar filtro por teléfono después de obtenerlas
    if (tipo === 'personal' || tipo === 'admin') {
      subscriptionsRaw = subscriptionsRaw.filter((s: any) => 
        s.destinatario_telefono === destinatarioTelefono?.trim()
      );
    }

    const validSubscriptions = subscriptionsRaw
      .map((s: any) => ({
        endpoint: s.endpoint,
        keys: {
          p256dh: s.p256dh,
          auth: s.auth_secret
        }
      }))
      .filter((sub: any) => sub.endpoint && sub.keys.p256dh && sub.keys.auth);

    const invalidCount = subscriptionsRaw.length - validSubscriptions.length;
    if (!validSubscriptions.length) {
      return new Response(JSON.stringify({
        success: true,
        sent: 0,
        total: 0,
        invalidSubscriptions: invalidCount,
        notif_id: record.id,
        message: 'No valid push subscriptions found'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Payload Web Push - simplificar para máximo compatibility
    const payloadForSW = {
      title: titulo,      // Web Push estándar usa "title"
      body: mensaje,     // Web Push estándar usa "body"
      link_url: linkUrl,
      tag: String(record.id),
      id: String(record.id),
      requireInteraction: false,  // Reduce problemas en algunos browsers
      silent: false,               // Permite sonido
      sound_url: 'default'        // Sonido por defecto del sistema
    };

    // 6. Enviar a cada suscripción en paralelo con logging detallado
    console.log('Sending push to', validSubscriptions.length, 'subscriptions with payload:', JSON.stringify(payloadForSW));

    const results = await Promise.all(
      validSubscriptions.map(async (sub) => {
        try {
          console.log('Sending to endpoint:', sub.endpoint.substring(0, 50) + '...');
          await webpush.sendNotification(sub as any, JSON.stringify(payloadForSW));
          console.log('✓ Push sent successfully to:', sub.endpoint.substring(0, 30));
          return { ok: true, endpoint: sub.endpoint };
        } catch (err: any) {
          console.error('✗ Push error:', err.statusCode, err.message || err.body);
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
          return {
            ok: false,
            endpoint: sub.endpoint,
            error: err?.message || String(err),
            statusCode: err?.statusCode
          };
        }
      })
    );

    const sent = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok);

    return new Response(JSON.stringify({
      success: true,
      sent,
      failed: failed.length,
      total: validSubscriptions.length,
      invalidSubscriptions: invalidCount,
      errors: failed,
      notif_id: record.id
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Error procesando el webhook',
      details: error?.message || String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
// redeploy trigger
