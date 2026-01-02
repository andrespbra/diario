
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  // Check standard process.env (common in Node and some build environments)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // Check window.process.env (common polyfill location)
  if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) {
    return (window as any).process.env[key];
  }

  // Check import.meta.env (Vite / Modern ESM environments)
  const meta = import.meta as any;
  if (typeof meta !== 'undefined' && meta.env) {
    if (meta.env[key]) return meta.env[key];
    if (meta.env[`VITE_${key}`]) return meta.env[`VITE_${key}`];
  }
  
  // Check direct window property (some environments inject directly)
  if (typeof window !== 'undefined' && (window as any)[key]) {
    return (window as any)[key];
  }

  return '';
};

const url = getEnv('SUPABASE_URL');
const key = getEnv('SUPABASE_ANON_KEY');

// More lenient configuration check - as long as they look like valid placeholders or real values
export const isSupabaseConfigured = !!url && url.length > 10 && !!key && key.length > 20;

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn("⚠️ Configuração do Supabase incompleta ou ausente.");
  console.debug("SUPABASE_URL detectada:", url ? "Sim (Inicia com " + url.substring(0, 10) + "...)" : "Não");
  console.debug("SUPABASE_ANON_KEY detectada:", key ? "Sim (Tamanho: " + key.length + ")" : "Não");
}

// Fallback values to prevent client creation crash, while isSupabaseConfigured flag handles logic
export const supabaseUrl = url || 'https://placeholder-project.supabase.co';
export const supabaseAnonKey = key || 'placeholder-key-needs-to-be-set-in-env';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
