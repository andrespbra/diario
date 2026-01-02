
import { createClient } from '@supabase/supabase-js';

/**
 * IMPORTANTE: Em muitos ambientes (Vite, Vercel, Webpack), 
 * o acesso literal (process.env.NOME) é necessário para a substituição de strings.
 * O acesso dinâmico process.env[key] muitas vezes falha.
 */

// Tentativa de leitura das URLs (Literais)
const rawUrl = 
  (typeof process !== 'undefined' ? process.env?.SUPABASE_URL : '') || 
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') || 
  ((import.meta as any).env?.VITE_SUPABASE_URL) || 
  ((import.meta as any).env?.SUPABASE_URL) || 
  (window as any).SUPABASE_URL || '';

// Tentativa de leitura das Chaves (Literais)
const rawKey = 
  (typeof process !== 'undefined' ? process.env?.SUPABASE_ANON_KEY : '') || 
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '') || 
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 
  ((import.meta as any).env?.SUPABASE_ANON_KEY) || 
  (window as any).SUPABASE_ANON_KEY || '';

export const supabaseUrl = rawUrl.trim();
export const supabaseAnonKey = rawKey.trim();

// Validação de configuração
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl.startsWith('http') && 
  !!supabaseAnonKey && 
  supabaseAnonKey.length > 20;

if (typeof window !== 'undefined') {
  if (isSupabaseConfigured) {
    console.log("✅ Supabase detectado:", supabaseUrl.substring(0, 15) + "...");
  } else {
    console.warn("🚨 Erro de Configuração: SUPABASE_URL ou SUPABASE_ANON_KEY não detectados.");
    console.debug("Dica: Certifique-se de que as variáveis de ambiente no Vercel/Editor estão sem aspas e com os nomes corretos.");
  }
}

// Fallback apenas para evitar crash na inicialização do objeto
const finalUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
