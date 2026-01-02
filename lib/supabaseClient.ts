
import { createClient } from '@supabase/supabase-js';

// Função robusta para capturar as chaves do Supabase de diferentes possíveis fontes de ambiente
const getEnvVar = (key: string) => {
  if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) return (window as any).process.env[key];
  if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  // @ts-ignore - Fallback para Vite se disponível
  if (typeof import.meta !== 'undefined' && import.meta.env?.[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
  return '';
};

const url = getEnvVar('SUPABASE_URL');
const key = getEnvVar('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!url && url.length > 10 && !url.includes('placeholder');

// Se não estiver configurado, usamos o placeholder para evitar crash imediato, 
// mas o isSupabaseConfigured avisará a UI
export const supabaseUrl = url || 'https://placeholder-project.supabase.co';
export const supabaseAnonKey = key || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
