
import { createClient } from '@supabase/supabase-js';

// Tenta obter as chaves de forma direta
const url = (import.meta as any).env?.VITE_SUPABASE_URL || (process as any).env?.SUPABASE_URL || '';
const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (process as any).env?.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!url && url.startsWith('http') && key.length > 20;

if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase: URL ou ANON_KEY não configuradas. O app funcionará em modo demonstração local limitado.");
}

export const supabaseUrl = url || 'https://placeholder.supabase.co';
export const supabaseAnonKey = key || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
