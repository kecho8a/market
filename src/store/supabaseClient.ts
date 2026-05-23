import { createClient } from '@supabase/supabase-js';

// URL y Clave anónima de Supabase inyectadas desde las variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
