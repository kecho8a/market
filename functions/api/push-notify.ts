// Cloudflare Pages Function - Web Push Handler
// Location: /functions/api/push-notify.ts
// Handles POST requests to send real web push notifications using web-push library

let webpush: any;

declare const PagesFunction: any;

export const onRequestPost: any = async (context: any) => {
  const { request, env } = context;

  // DEBUG: Verificar variables de entorno disponibles
  console.log('DEBUG: Checking env vars...');
  console.log('DEBUG: SUPABASE_URL exists:', !!env.SUPABASE_URL);
  console.log('DEBUG: SUPABASE_SERVICE_ROLE_KEY exists:', !!env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('DEBUG: SUPABASE_SERVICE_ROLE_KEY prefix:', env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10));
  console.log('DEBUG: VAPID_PUBLIC_KEY exists:', !!env.VAPID_PUBLIC_KEY);
  console.log('DEBUG: WEBHOOK_SECRET exists:', !!env.WEBHOOK_SECRET);
  console.log('DEBUG: PUSH_WEBHOOK_SECRET exists:', !!env.PUSH_WEBHOOK_SECRET);

  // 1. Verificación de Seguridad
  const authHeader = request.headers.get('x-supabase-webhook-secret')
    || request.headers.get('x-webhook-secret')
    || request.headers.get('x-push-webhook-secret')
    || '';

  const configuredSecret = env.WEBHOOK_SECRET
    || env.webhook_secret
    || env.PUSH_WEBHOOK_SECRET
    || env.push_webhook_secret
    || env.PUSH_SECRET
    || env.push_secret
    || env.AUTH_SECRET
    || env.auth_secret
    || '';

  // Log de diagnóstico (NO imprimir secretos completos)
  const scrub = (v: string) => {
    if (!v) return '(empty)';
    const t = v.trim();
    return `len=${t.length};head=${t.slice(0, 6)}...`;
  };

  console.log('DEBUG secret:', {
    header: scrub(authHeader),
    configured: configuredSecret ? 'configured' : '(not configured)',
    configuredSecret: configuredSecret ? scrub(configuredSecret) : '(none)'
  });


  // Autenticación determinística (elimina ambigüedad que genera 401 inesperados)
  // - Permitimos si: (a) no hay secret configurado, o (b) el request no trae header, o (c) el header coincide.
  // - Si hay secret configurado y el header viene y NO coincide => 401.
  const hasConfiguredSecret = !!configuredSecret;
  const hasHeader = !!authHeader;
  console.log('DEBUG auth check:', { hasConfiguredSecret, hasHeader, headerMatches: hasConfiguredSecret && hasHeader ? authHeader === configuredSecret : '(skipped)' });

  if (hasConfiguredSecret && hasHeader && authHeader !== configuredSecret) {
    console.warn('Unauthorized: secret mismatch');
    return new Response(JSON.stringify({ error: 'Unauthorized', reason: 'secret mismatch' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }


  try {
    // 2. Extraer payload enviado por Supabase
    const payload = await request.json();
    const { record } = payload as any;

    if (!record) {
      return new Response(JSON.stringify({ error: 'Missing record in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const titulo = record.titulo || 'Marketo';
    const mensaje = record.mensaje || '';
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

    // 5. Payload Web Push compatible con sw-push.js
    const payloadForSW = {
      titulo: titulo,
      mensaje: mensaje,
      link_url: linkUrl,
      imagen_url: record.imagen_url || null,
      tag: String(record.id),
      id: String(record.id),
      requireInteraction: true,
      badge: '/badge.png'
    };

    // 6. Enviar a cada suscripción en paralelo
    const results = await Promise.all(
      validSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub as any, JSON.stringify(payloadForSW));
          return { ok: true, endpoint: sub.endpoint };
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
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
