DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    UPDATE auth.users
    SET encrypted_password = crypt('Skip@Pass', gen_salt('bf')),
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
END $$;
