// Nota: en Cloudflare Pages Functions, el bundling puede variar.
// Para evitar errores de import en runtime, usamos require dinámico.
let webpush: any;
try { webpush = require('web-push'); } catch { /* runtime resolverá si es posible */ }


// Tipo disponible solo en Cloudflare Pages Functions / runtime.
// Si el tipo no existe en el entorno local de TS, el archivo igualmente compila en runtime.
declare const PagesFunction: any;

export const onRequestPost: any = async (context: any) => {
  const { request, env } = context;

  // 1. Verificación de Seguridad (Header secreto configurado en Supabase)
  const authHeader = request.headers.get('x-supabase-webhook-secret');
  if (authHeader !== env.WEBHOOK_SECRET) {
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

    webpush.setVapidDetails(
      'mailto:admin@marketo.com.ve',
      vapidPublic,
      vapidPrivate
    );

    // 4. Leer suscripciones desde Supabase
    // IMPORTANTE: asume que tu tabla existe y guarda:
    // user_id, endpoint, p256dh, auth_secret
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY in env' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Import dinámico para evitar bundling pesado
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Filtro por destinatario si aplica (personal)
    const tipo = record.tipo;
    const destinatarioTelefono = record.destinatario_telefono;

    let query = supabase.from('push_subscriptions').select('*');

    if (tipo === 'personal' && destinatarioTelefono) {
      // Si tu tabla push_subscriptions no liga por telefono, esto puede requerir JOIN.
      // Alternativa: guardar user_id = usuario correspondiente al telefono.
      query = query.eq('telefono', destinatarioTelefono);
    }

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

    // 5. Payload Web Push
    const payloadForSW = {
      title: titulo,
      body: mensaje,
      url: linkUrl,
      tag: String(record.id),
      id: String(record.id),
      requireInteraction: true,
      // opcional: imagen/sound desde tu ruta pública
      sound: '/sounds/notification.mp3'
    };

    // 6. Enviar a cada suscripción
    const results: any[] = [];
    for (const sub of subscriptions) {
      try {
        const res = await webpush.sendNotification(sub as any, JSON.stringify(payloadForSW));
        results.push({ ok: true });
      } catch (e: any) {
        results.push({ ok: false, error: e?.message || String(e) });
      }
    }

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

