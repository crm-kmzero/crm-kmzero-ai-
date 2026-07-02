ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS dados_cotacao JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.base_conhecimento ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'seguros';
ALTER TABLE public.base_conhecimento ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE public.base_conhecimento ADD COLUMN IF NOT EXISTS subtitulo TEXT;
ALTER TABLE public.base_conhecimento ADD COLUMN IF NOT EXISTS imagem_url TEXT;
ALTER TABLE public.base_conhecimento ADD COLUMN IF NOT EXISTS arquivo_url TEXT;
ALTER TABLE public.base_conhecimento ADD COLUMN IF NOT EXISTS arquivo_nome TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('produtos', 'produtos', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "produtos_bucket_read" ON storage.objects;
CREATE POLICY "produtos_bucket_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'produtos');
DROP POLICY IF EXISTS "produtos_bucket_upload" ON storage.objects;
CREATE POLICY "produtos_bucket_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'produtos');
DROP POLICY IF EXISTS "produtos_bucket_update" ON storage.objects;
CREATE POLICY "produtos_bucket_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'produtos');
DROP POLICY IF EXISTS "produtos_bucket_delete" ON storage.objects;
CREATE POLICY "produtos_bucket_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'produtos');

INSERT INTO base_conhecimento (produto, categoria, titulo, subtitulo, conteudo)
SELECT 'Seguro Auto', 'seguros', 'Seguro Auto Km Zero', 'Proteção completa para seu veículo',
  '<p>O Seguro Auto Km Zero oferece cobertura completa contra roubo, furto, colisão e terceiros.</p><ul><li>Cobertura 100% da tabela FIPE</li><li>Assistência 24h</li><li>Carro reserva por 30 dias</li></ul>'
WHERE NOT EXISTS (SELECT 1 FROM base_conhecimento WHERE titulo = 'Seguro Auto Km Zero');

INSERT INTO base_conhecimento (produto, categoria, titulo, subtitulo, conteudo)
SELECT 'Consorcio', 'consorcios', 'Consórcio Imobiliário', 'Realize o sonho da casa própria',
  '<p>Consórcio imobiliário com cartas de R$ 80 mil a R$ 500 mil.</p><ul><li>Parcelas a partir de R$ 800</li><li>Sem juros bancários</li><li>Sorteios mensais</li></ul>'
WHERE NOT EXISTS (SELECT 1 FROM base_conhecimento WHERE titulo = 'Consórcio Imobiliário');

INSERT INTO base_conhecimento (produto, categoria, titulo, subtitulo, conteudo)
SELECT 'Financiamento', 'financiamentos', 'Financiamento Veicular', 'Financie seu veículo com as melhores condições',
  '<p>Financiamento de veículos novos e seminovos com prazos flexíveis.</p><ul><li>Aprovação rápida</li><li>Até 100% do valor do veículo</li><li>Simulação personalizada</li></ul>'
WHERE NOT EXISTS (SELECT 1 FROM base_conhecimento WHERE titulo = 'Financiamento Veicular');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'base_conhecimento') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.base_conhecimento;
  END IF;
END $$;
