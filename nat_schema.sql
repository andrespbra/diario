
-- SCRIPT DE CRIAÇÃO DA TABELA NAT
CREATE TABLE IF NOT EXISTS public.nat_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hostname TEXT UNIQUE,
    modelo TEXT,
    serie TEXT,
    filial TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.nat_entries ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "nat_select_policy" ON public.nat_entries;
DROP POLICY IF EXISTS "nat_insert_policy" ON public.nat_entries;
DROP POLICY IF EXISTS "nat_update_policy" ON public.nat_entries;

CREATE POLICY "nat_select_policy" ON public.nat_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "nat_insert_policy" ON public.nat_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "nat_update_policy" ON public.nat_entries FOR UPDATE TO authenticated USING (true);

-- Permissões
GRANT ALL ON TABLE public.nat_entries TO authenticated;
GRANT ALL ON TABLE public.nat_entries TO service_role;
