// Cloudflare Pages Function - Web Push Handler
// Location: /functions/api/push-notify.ts
// Handles POST requests to send real web push notifications using web-push library

let webpush: any;

declare const PagesFunction: any;

export const onRequestPost: any = async (context: any) => {
  const { request, env } = context;

  // 1. Verificación de Seguridad (Header secreto configurado en Supabase)
  const authHeader = request.headers.get('x-supabase-webhook-secret');
  const configuredSecret = env.WEBHOOK_SECRET || env.webhook_secret;
  if (authHeader !== configuredSecret) {
    return new Response('Unauthorized', { status: 401 });
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

    let query = supabase.from('push_subscriptions').select('*');

    // Si es personal o admin, filtramos por el teléfono del destinatario registrado
    if ((tipo === 'personal' || tipo === 'admin') && destinatarioTelefono) {
      query = query.eq('destinatario_telefono', destinatarioTelefono.trim());
    }

    // Para tipo = 'todos' (promociones) no aplicamos filtro
    const { data: subs, error: subsErr } = await query;
    if (subsErr) {
      return new Response(JSON.stringify({ error: 'Failed loading subscriptions', details: subsErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const subscriptions = (subs || []).map((s: any) => ({
      endpoint: s.endpoint,
      keys: {
        p256dh: s.p256dh,
        auth: s.auth_secret
      }
    }));

    if (!subscriptions.length) {
      return new Response(JSON.stringify({ success: true, sent: 0, notif_id: record.id, message: 'No subscriptions found' }), {
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
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub as any, JSON.stringify(payloadForSW));
          return { ok: true };
        } catch (err: any) {
          // Si el endpoint ya expiró (410) o no existe (404), eliminar de la base de datos
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
          return { ok: false, error: err?.message || String(err) };
        }
      })
    );

    const sent = results.filter(r => r.ok).length;

    return new Response(JSON.stringify({
      success: true,
      sent,
      total: subscriptions.length,
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
