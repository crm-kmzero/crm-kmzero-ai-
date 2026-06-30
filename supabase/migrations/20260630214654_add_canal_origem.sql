ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS canal_origem TEXT DEFAULT 'whatsapp';

ALTER TABLE public.base_conhecimento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "base_conhecimento_select" ON public.base_conhecimento;
CREATE POLICY "base_conhecimento_select" ON public.base_conhecimento
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "base_conhecimento_insert" ON public.base_conhecimento;
CREATE POLICY "base_conhecimento_insert" ON public.base_conhecimento
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "base_conhecimento_update" ON public.base_conhecimento;
CREATE POLICY "base_conhecimento_update" ON public.base_conhecimento
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "base_conhecimento_delete" ON public.base_conhecimento;
CREATE POLICY "base_conhecimento_delete" ON public.base_conhecimento
  FOR DELETE TO authenticated USING (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    UPDATE auth.users SET
      encrypted_password = crypt('Skip@Pass123', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = '',
      email_change_token_current = '',
      phone_change = '',
      phone_change_token = '',
      reauthentication_token = ''
    WHERE email = 'adriana.araujo@kmzero.com.br';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'gabrielaraujo@kmzero.com.br') THEN
    UPDATE auth.users SET
      encrypted_password = crypt('Skip@Pass123', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = '',
      email_change_token_current = '',
      phone_change = '',
      phone_change_token = '',
      reauthentication_token = ''
    WHERE email = 'gabrielaraujo@kmzero.com.br';
  END IF;
END $$;

INSERT INTO public.profiles (id, email, name, role, status)
SELECT id, email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  'admin-master', 'active'
FROM auth.users
WHERE email IN ('adriana.araujo@kmzero.com.br', 'gabrielaraujo@kmzero.com.br')
ON CONFLICT (id) DO UPDATE SET role = 'admin-master', status = 'active';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'base_conhecimento') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.base_conhecimento;
  END IF;
END $$;
