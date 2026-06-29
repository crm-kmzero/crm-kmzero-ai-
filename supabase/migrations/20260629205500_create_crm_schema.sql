DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'produto_interesse_type') THEN
    CREATE TYPE produto_interesse_type AS ENUM ('Auto', 'Residencial', 'Vida', 'Consórcio', 'Empresarial');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estagio_type') THEN
    CREATE TYPE estagio_type AS ENUM ('novo', 'contato', 'qualificado', 'fechado', 'perdido');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origem_type') THEN
    CREATE TYPE origem_type AS ENUM ('whatsapp', 'site', 'indicacao', 'formulario', 'presencial');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sentimento_type') THEN
    CREATE TYPE sentimento_type AS ENUM ('positivo', 'neutro', 'negativo');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  produto_interesse produto_interesse_type,
  estagio estagio_type DEFAULT 'novo',
  prioridade INT DEFAULT 1 CHECK (prioridade >= 1 AND prioridade <= 3),
  origem origem_type DEFAULT 'whatsapp',
  valor_estimado DECIMAL(12,2),
  vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ultimo_contato TIMESTAMPTZ,
  proxima_acao TEXT,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interacoes_sdr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  mensagem_ia TEXT,
  mensagem_cliente TEXT,
  intencao_detectada VARCHAR(255),
  sentimento sentimento_type DEFAULT 'neutro',
  data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metricas_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  leads_novos INT DEFAULT 0,
  leads_contatados INT DEFAULT 0,
  leads_qualificados INT DEFAULT 0,
  leads_fechados INT DEFAULT 0,
  total_whatsapp_ativos INT DEFAULT 0,
  taxa_conversao DECIMAL(5,2) DEFAULT 0,
  atendimentos_ana INT DEFAULT 0,
  qualificados_ana INT DEFAULT 0,
  UNIQUE(data)
);

CREATE INDEX IF NOT EXISTS idx_leads_estagio ON leads(estagio);
CREATE INDEX IF NOT EXISTS idx_leads_vendedor ON leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_lead ON interacoes_sdr(lead_id);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes_sdr ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select" ON leads;
CREATE POLICY "leads_select" ON leads FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "leads_insert" ON leads;
CREATE POLICY "leads_insert" ON leads FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "leads_update" ON leads;
CREATE POLICY "leads_update" ON leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "leads_delete" ON leads;
CREATE POLICY "leads_delete" ON leads FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "interacoes_select" ON interacoes_sdr;
CREATE POLICY "interacoes_select" ON interacoes_sdr FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "interacoes_insert" ON interacoes_sdr;
CREATE POLICY "interacoes_insert" ON interacoes_sdr FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "interacoes_update" ON interacoes_sdr;
CREATE POLICY "interacoes_update" ON interacoes_sdr FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "interacoes_delete" ON interacoes_sdr;
CREATE POLICY "interacoes_delete" ON interacoes_sdr FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "metricas_select" ON metricas_diarias;
CREATE POLICY "metricas_select" ON metricas_diarias FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "metricas_insert" ON metricas_diarias;
CREATE POLICY "metricas_insert" ON metricas_diarias FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "metricas_update" ON metricas_diarias;
CREATE POLICY "metricas_update" ON metricas_diarias FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "metricas_delete" ON metricas_diarias;
CREATE POLICY "metricas_delete" ON metricas_diarias FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION update_data_atualizacao()
RETURNS trigger AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_data_atualizacao ON leads;
CREATE TRIGGER leads_data_atualizacao
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_data_atualizacao();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'leads') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'interacoes_sdr') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.interacoes_sdr;
  END IF;
END $$;

DO $$
DECLARE
  vendedor_uuid UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    vendedor_uuid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      vendedor_uuid,
      '00000000-0000-0000-0000-000000000000',
      'adriana.araujo@kmzero.com.br',
      crypt('Skip@Pass2026', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Adriana Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  ELSE
    SELECT id INTO vendedor_uuid FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM leads LIMIT 1) THEN
    INSERT INTO leads (nome, telefone, email, produto_interesse, estagio, prioridade, origem, valor_estimado, vendedor_id, ultimo_contato, proxima_acao) VALUES
      ('Carlos Santos', '(11) 98765-4321', 'carlos@email.com', 'Auto', 'novo', 3, 'whatsapp', 80000, vendedor_uuid, NOW() - INTERVAL '10 minutes', 'Enviar cotacao'),
      ('Mariana Costa', '(11) 91234-5678', 'mariana@email.com', 'Consorcio', 'novo', 2, 'whatsapp', 300000, vendedor_uuid, NOW() - INTERVAL '30 minutes', 'Agendar reuniao'),
      ('Joao Silva', '(11) 99999-8888', 'joao@email.com', 'Vida', 'contato', 1, 'site', 500000, vendedor_uuid, NOW() - INTERVAL '2 hours', 'Confirmar interesse'),
      ('Ana Oliveira', '(11) 97777-6666', 'ana@email.com', 'Residencial', 'contato', 2, 'indicacao', 250000, vendedor_uuid, NOW() - INTERVAL '3 hours', 'Enviar proposta'),
      ('Pedro Henrique', '(11) 96666-5555', 'pedro@email.com', 'Auto', 'contato', 3, 'whatsapp', 150000, vendedor_uuid, NOW() - INTERVAL '1 hour', 'Ligar urgente'),
      ('Juliana Ferreira', '(11) 95555-4444', 'juliana@email.com', 'Consorcio', 'qualificado', 2, 'formulario', 200000, vendedor_uuid, NOW() - INTERVAL '5 hours', 'Fechar proposta'),
      ('Rafael Souza', '(11) 94444-3333', 'rafael@email.com', 'Empresarial', 'qualificado', 1, 'presencial', 500000, vendedor_uuid, NOW() - INTERVAL '1 day', 'Aguardar documentos'),
      ('Fernanda Lima', '(11) 93333-2222', 'fernanda@email.com', 'Vida', 'qualificado', 3, 'whatsapp', 300000, vendedor_uuid, NOW() - INTERVAL '6 hours', 'Finalizar contratacao'),
      ('Bruno Carvalho', '(11) 92222-1111', 'bruno@email.com', 'Auto', 'fechado', 1, 'site', 90000, vendedor_uuid, NOW() - INTERVAL '2 days', 'Enviar apolice'),
      ('Camila Rodrigues', '(11) 91111-0000', 'camila@email.com', 'Residencial', 'fechado', 2, 'indicacao', 350000, vendedor_uuid, NOW() - INTERVAL '1 day', 'Ativacao concluida');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM interacoes_sdr LIMIT 1) THEN
    INSERT INTO interacoes_sdr (lead_id, mensagem_ia, mensagem_cliente, intencao_detectada, sentimento, data_hora) VALUES
      ((SELECT id FROM leads WHERE nome = 'Carlos Santos' LIMIT 1), 'Ola! Sou a Ana, sua assistente virtual da Km Zero. Como posso ajudar?', 'Gostaria de cotar seguro auto', 'cotacao', 'positivo', NOW() - INTERVAL '1 hour'),
      ((SELECT id FROM leads WHERE nome = 'Carlos Santos' LIMIT 1), 'Perfeito! Qual a marca e modelo do seu veiculo?', 'Tenho um Jeep Compass 2023', 'dados_veiculo', 'positivo', NOW() - INTERVAL '55 minutes'),
      ((SELECT id FROM leads WHERE nome = 'Carlos Santos' LIMIT 1), 'Excelente! Vou preparar uma cotacao especial para voce. Um momento.', 'Ok, aguardo', 'aguardando', 'neutro', NOW() - INTERVAL '50 minutes'),
      ((SELECT id FROM leads WHERE nome = 'Mariana Costa' LIMIT 1), 'Ola! Notei seu interesse em consorcio. Posso ajudar?', 'Sim, quero saber sobre consorcio imobiliario', 'consorcio', 'positivo', NOW() - INTERVAL '45 minutes'),
      ((SELECT id FROM leads WHERE nome = 'Mariana Costa' LIMIT 1), 'Temos cartas de R$ 300 mil com parcelas a partir de R$ 2.500. Te interessa?', 'Qual a taxa de administracao?', 'duvida', 'neutro', NOW() - INTERVAL '40 minutes');
  END IF;

  INSERT INTO metricas_diarias (data, leads_novos, leads_contatados, leads_qualificados, leads_fechados, total_whatsapp_ativos, taxa_conversao, atendimentos_ana, qualificados_ana)
  VALUES (CURRENT_DATE, 12, 15, 12, 8, 8, 32.00, 38, 22)
  ON CONFLICT (data) DO NOTHING;
END $$;
