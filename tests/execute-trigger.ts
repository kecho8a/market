import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gqhanfjhqfeqsgpscmet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaGFuZmpocWZlcXNncHNjbWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIzMzEyOSwiZXhwIjoyMDk0ODA5MTI5fQ.zVOk9zqT6xFROwhp9wpb74ERfO1T0pUM_eabYuQ93i8'
);

// Step 1: Create exec_sql function
const createExecSql = `
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;
`;

console.log('Step 1: Creating exec_sql function...');
const r1 = await supabase.rpc('exec_sql', { query: createExecSql });
console.log('Result:', JSON.stringify(r1));

// Wait for cache refresh
await new Promise(r => setTimeout(r, 2000));

// Step 2: Execute the trigger update
const triggerSql = `
CREATE OR REPLACE FUNCTION public.handle_new_notification_push()
RETURNS TRIGGER AS $$
DECLARE
  v_webhook_url TEXT;
  v_webhook_secret TEXT;
  v_site_nombre TEXT;
  v_logo_url TEXT;
BEGIN
  SELECT push_webhook_url, push_webhook_secret 
  INTO v_webhook_url, v_webhook_secret 
  FROM public.store_config 
  WHERE id = 1;

  SELECT COALESCE(site_nombre, 'Marketo'), COALESCE(logo_url, '/icon.png')
  INTO v_site_nombre, v_logo_url
  FROM public.store_config 
  WHERE id = 1;

  IF v_webhook_url IS NOT NULL AND v_webhook_url <> '' AND NEW.tipo IN ('todos', 'personal', 'admin', 'request') THEN
    PERFORM net.http_post(
      url := v_webhook_url,
      body := jsonb_build_object(
        'title', NEW.titulo,
        'body', NEW.mensaje,
        'icon', COALESCE(NEW.imagen_url, v_logo_url, '/icon.png'),
        'badge', v_logo_url,
        'store_name', v_site_nombre,
        'sound', 'default',
        'vibrate', ARRAY[300, 100, 300, 100, 300],
        'tag', 'marketo-' || NEW.id,
        'url', COALESCE(NEW.link_url, '/'),
        'record', jsonb_build_object(
          'id', NEW.id,
          'title', NEW.titulo,
          'body', NEW.mensaje,
          'icon', COALESCE(NEW.imagen_url, v_logo_url, '/icon.png'),
          'badge', v_logo_url,
          'store_name', v_site_nombre,
          'tag', 'marketo-' || NEW.id,
          'renotify', true,
          'vibrate', ARRAY[300, 100, 300, 100, 300],
          'sound', 'default',
          'titulo', NEW.titulo,
          'mensaje', NEW.mensaje,
          'imagen_url', COALESCE(NEW.imagen_url, ''),
          'link_url', COALESCE(NEW.link_url, '/'),
          'tipo', NEW.tipo,
          'destinatario_telefono', COALESCE(NEW.destinatario_telefono, '')
        )
      )::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-push-webhook-secret', COALESCE(v_webhook_secret, '')
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'No se pudo invocar webhook de push: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

console.log('\nStep 2: Updating push trigger...');
const r2 = await supabase.rpc('exec_sql', { query: triggerSql });
console.log('Result:', JSON.stringify(r2));

// Verify
console.log('\nStep 3: Verifying trigger exists...');
const r3 = await supabase.rpc('exec_sql', { query: "SELECT proname FROM pg_proc WHERE proname = 'handle_new_notification_push'" });
console.log('Result:', JSON.stringify(r3));
