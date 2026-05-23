import { createClient } from '@supabase/supabase-js';

// URL y Clave anónima de Supabase obtenidas de las variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Check environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
