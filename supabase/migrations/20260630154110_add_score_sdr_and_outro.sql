ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score_sdr INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'Outro'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'produto_interesse_type')
  ) THEN
    ALTER TYPE produto_interesse_type ADD VALUE 'Outro';
  END IF;
END $$;
