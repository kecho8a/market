// Shared config for test scripts - reads from .env
import * as dotenv from 'dotenv';
dotenv.config();

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
export const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || '';
export const DB_HOST = process.env.SUPABASE_DB_HOST || 'db.gqhanfjhqfeqsgpscmet.supabase.co';

export const SUPERADMIN_EMAIL = 'sugolo28@gmail.com';
export const SUPERADMIN_PASSWORD = 'susa.280';
export const ADMIN_EMAIL = 'kecho8a@gmail.com';
