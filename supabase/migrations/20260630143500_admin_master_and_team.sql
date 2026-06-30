CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'broker',
  status TEXT NOT NULL DEFAULT 'invited',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_master()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_app_meta_data->>'role' = 'admin-master'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'role', 'broker'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    UPDATE auth.users SET
      encrypted_password = crypt('Luga94@@', gen_salt('bf')),
      raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{role}',
        '"admin-master"'::jsonb
      ),
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

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'gabrielaraujo@kmzero.com.br') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'gabrielaraujo@kmzero.com.br',
      crypt('Luga94@@', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"], "role": "admin-master"}',
      '{"name": "Gabriel Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  ELSE
    UPDATE auth.users SET
      encrypted_password = crypt('Luga94@@', gen_salt('bf')),
      raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{role}',
        '"admin-master"'::jsonb
      ),
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

DROP POLICY IF EXISTS "leads_select" ON leads;
CREATE POLICY "leads_select" ON leads FOR SELECT TO authenticated
  USING (public.is_admin_master() OR vendedor_id = auth.uid());
DROP POLICY IF EXISTS "leads_insert" ON leads;
CREATE POLICY "leads_insert" ON leads FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_master() OR vendedor_id = auth.uid());
DROP POLICY IF EXISTS "leads_update" ON leads;
CREATE POLICY "leads_update" ON leads FOR UPDATE TO authenticated
  USING (public.is_admin_master() OR vendedor_id = auth.uid())
  WITH CHECK (public.is_admin_master() OR vendedor_id = auth.uid());
DROP POLICY IF EXISTS "leads_delete" ON leads;
CREATE POLICY "leads_delete" ON leads FOR DELETE TO authenticated
  USING (public.is_admin_master() OR vendedor_id = auth.uid());

DROP POLICY IF EXISTS "interacoes_select" ON interacoes_sdr;
CREATE POLICY "interacoes_select" ON interacoes_sdr FOR SELECT TO authenticated
  USING (public.is_admin_master() OR EXISTS (SELECT 1 FROM leads WHERE leads.id = interacoes_sdr.lead_id AND leads.vendedor_id = auth.uid()));
DROP POLICY IF EXISTS "interacoes_insert" ON interacoes_sdr;
CREATE POLICY "interacoes_insert" ON interacoes_sdr FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_master() OR EXISTS (SELECT 1 FROM leads WHERE leads.id = interacoes_sdr.lead_id AND leads.vendedor_id = auth.uid()));
DROP POLICY IF EXISTS "interacoes_update" ON interacoes_sdr;
CREATE POLICY "interacoes_update" ON interacoes_sdr FOR UPDATE TO authenticated
  USING (public.is_admin_master()) WITH CHECK (public.is_admin_master());
DROP POLICY IF EXISTS "interacoes_delete" ON interacoes_sdr;
CREATE POLICY "interacoes_delete" ON interacoes_sdr FOR DELETE TO authenticated
  USING (public.is_admin_master());

DROP POLICY IF EXISTS "metricas_select" ON metricas_diarias;
CREATE POLICY "metricas_select" ON metricas_diarias FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "metricas_insert" ON metricas_diarias;
CREATE POLICY "metricas_insert" ON metricas_diarias FOR INSERT TO authenticated WITH CHECK (public.is_admin_master());
DROP POLICY IF EXISTS "metricas_update" ON metricas_diarias;
CREATE POLICY "metricas_update" ON metricas_diarias FOR UPDATE TO authenticated
  USING (public.is_admin_master()) WITH CHECK (public.is_admin_master());
DROP POLICY IF EXISTS "metricas_delete" ON metricas_diarias;
CREATE POLICY "metricas_delete" ON metricas_diarias FOR DELETE TO authenticated USING (public.is_admin_master());

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin_master() OR id = auth.uid());
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_master() OR id = auth.uid());
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin_master() OR id = auth.uid())
  WITH CHECK (public.is_admin_master() OR id = auth.uid());
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin_master());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
