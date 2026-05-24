export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  // 1. Verificación de Seguridad (Header secreto configurado en Supabase)
  const authHeader = request.headers.get('x-supabase-webhook-secret');
  if (authHeader !== env.WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Extraer el payload enviado por Supabase
    const payload = await request.json();
    
    // El objeto record contiene la fila insertada en la tabla 'notifications'
    const { record } = payload; 

    console.log('Nueva notificación recibida:', record.titulo);

    // 3. Lógica de Web Push (Aquí conectarías con tu lógica de FCM o WebPush API)
    // Por ahora, validamos la recepción
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook recibido y procesando push',
      notif_id: record.id 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error procesando el webhook', 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};