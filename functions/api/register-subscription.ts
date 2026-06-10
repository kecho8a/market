// Cloudflare Pages Function - Register Push Subscription
// Location: /functions/api/register-subscription.ts
// Handles POST requests to save a push subscription without requiring user login

declare const PagesFunction: any;

export const onRequestPost: any = async (context: any) => {
  const { request, env } = context;

  try {
    const payload = await request.json();

    // Accept { subscription } format or direct fields
    const subscription = payload.subscription || payload;

    if (!subscription || !subscription.endpoint) {
      return new Response(JSON.stringify({ error: 'Missing subscription object or endpoint' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    console.log('DEBUG register-subscription: SUPABASE_URL exists:', !!supabaseUrl, 'SUPABASE_SERVICE_ROLE_KEY exists:', !!env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_ANON_KEY exists:', !!env.SUPABASE_ANON_KEY);
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or keys in env', debug: { hasUrl: !!supabaseUrl, hasServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY, hasAnonKey: !!env.SUPABASE_ANON_KEY } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate anonymous_id for device if not provided
    const anonymousId = payload.anonymous_id || crypto.randomUUID();

    // Upsert subscription - save with user_id: null for anonymous users
    const subJSON = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;

    // Primero verificar si ya existe esta suscripción
    let existingSub: any = null;
    try {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', subJSON.endpoint)
        .single();
      existingSub = data;
    } catch (e: any) {
      // No existe - es un error "No rows found", ignorable
      console.log('No existing subscription found for endpoint');
    }

    let dbError: any;
    if (existingSub) {
      // Actualizar si ya existe
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          p256dh: subJSON.keys?.p256dh,
          auth_secret: subJSON.keys?.auth,
          anonymous_id: anonymousId
        })
        .eq('endpoint', subJSON.endpoint);
      dbError = updateError;
      console.log('Updating existing subscription, result:', dbError ? dbError.message : 'success');
    } else {
      // Insertar nueva suscripción
      const { error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: null,
          endpoint: subJSON.endpoint,
          p256dh: subJSON.keys?.p256dh,
          auth_secret: subJSON.keys?.auth,
          destinatario_telefono: null,
          anonymous_id: anonymousId,
          created_at: new Date().toISOString()
        });
      dbError = insertError;
      console.log('Inserting new subscription, result:', dbError ? dbError.message : 'success');
    }

    if (dbError) {
      console.error('DEBUG register-subscription db error:', JSON.stringify(dbError));
      return new Response(JSON.stringify({ error: 'Failed to save subscription', details: dbError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Subscription saved',
      anonymous_id: anonymousId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Error registering subscription',
      details: error?.message || String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};