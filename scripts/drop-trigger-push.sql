-- ============================================================
-- ELIMINAR TRIGGER DUPLICADO DE PUSH NOTIFICATIONS
-- Ejecutar en: Supabase SQL Editor (Dashboard)
-- ============================================================
-- El frontend ya envía push notifications directamente via
-- fetch('/api/push-notify'). Este trigger causaba DOBLE envío.

-- 1. Eliminar el trigger
DROP TRIGGER IF EXISTS trigger_notify_push ON public.notifications;

-- 2. Eliminar la función del trigger
DROP FUNCTION IF EXISTS public.handle_new_notification_push();

-- 3. Verificar que se eliminó correctamente
-- (debería retornar 0 filas)
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_notify_push';

-- 4. Verificar que la función fue eliminada
SELECT proname 
FROM pg_proc 
WHERE proname = 'handle_new_notification_push';
