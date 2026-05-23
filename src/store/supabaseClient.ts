import { createClient } from '@supabase/supabase-js';

// URL y Clave anónima públicas de Supabase obtenidas de variables de entorno (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicializar y exportar el cliente de Supabase
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);
