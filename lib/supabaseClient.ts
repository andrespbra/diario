
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
    if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) return (window as any).process.env[key];
    if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
    return '';
};

const url = getEnv('SUPABASE_URL');
const key = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!url && url.startsWith('http') && key.length > 20;

export const supabaseUrl = url || 'https://placeholder.supabase.co';
export const supabaseAnonKey = key || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
