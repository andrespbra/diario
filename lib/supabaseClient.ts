
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  // 1. Tenta process.env (Global/Node)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return String(process.env[key]);
    if (process.env[`VITE_${key}`]) return String(process.env[`VITE_${key}`]);
  }
  
  // 2. Tenta window.process.env (Polyfill)
  const win = typeof window !== 'undefined' ? (window as any) : {} as any;
  if (win.process?.env) {
    if (win.process.env[key]) return String(win.process.env[key]);
    if (win.process.env[`VITE_${key}`]) return String(win.process.env[`VITE_${key}`]);
  }

  // 3. Tenta import.meta.env (Vite moderno)
  try {
    const meta = (import.meta as any);
    if (meta.env) {
      if (meta.env[key]) return String(meta.env[key]);
      if (meta.env[`VITE_${key}`]) return String(meta.env[`VITE_${key}`]);
    }
  } catch (e) {}

  // 4. Tenta window direto
  if (win[key]) return String(win[key]);
  if (win[`VITE_${key}`]) return String(win[`VITE_${key}`]);

  return '';
};

const url = getEnv('SUPABASE_URL');
const key = getEnv('SUPABASE_ANON_KEY');

// Verifica se as chaves parecem minimamente válidas
export const isSupabaseConfigured = !!url && url.includes('http') && !!key && key.length > 10;

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn("🚨 Configuração do Supabase pendente.");
}

// Fallbacks para evitar que o client.create quebre o restante da renderização
export const supabaseUrl = url || 'https://placeholder.supabase.co';
export const supabaseAnonKey = key || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
