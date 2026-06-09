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
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or keys in env' }), {
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

    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: null,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh,
        auth_secret: subJSON.keys?.auth,
        destinatario_telefono: null,
        anonymous_id: anonymousId,
        created_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });

    if (error) {
      console.error('DEBUG register-subscription upsert error:', JSON.stringify(error));
      return new Response(JSON.stringify({ error: 'Failed to save subscription', details: error.message }), {
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