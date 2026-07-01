ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ia_ativa BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS public.notas_internas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  corretor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  conteudo TEXT NOT NULL,
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notas_lead ON public.notas_internas(lead_id);

ALTER TABLE public.notas_internas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notas_select" ON public.notas_internas;
CREATE POLICY "notas_select" ON public.notas_internas
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "notas_insert" ON public.notas_internas;
CREATE POLICY "notas_insert" ON public.notas_internas
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "notas_update" ON public.notas_internas;
CREATE POLICY "notas_update" ON public.notas_internas
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "notas_delete" ON public.notas_internas;
CREATE POLICY "notas_delete" ON public.notas_internas
  FOR DELETE TO authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notas_internas') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notas_internas;
  END IF;
END $$;
