import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables
const getEnvVar = (key: string, viteKey: string) => {
  let value = '';
  try {
    // Check import.meta.env (Vite)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      value = (import.meta as any).env[viteKey] || '';
    }
    // Check process.env (Node/Webpack fallback)
    if (!value && typeof process !== 'undefined' && process.env) {
      value = process.env[key] || '';
    }
  } catch (e) {
    console.warn('Error reading env vars', e);
  }
  return value;
};

const url = getEnvVar('SUPABASE_URL', 'VITE_SUPABASE_URL');
const key = getEnvVar('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!url && url !== 'https://placeholder.supabase.co' && !url.includes('placeholder');

export const supabaseUrl = url || 'https://placeholder.supabase.co';
export const supabaseAnonKey = key || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);