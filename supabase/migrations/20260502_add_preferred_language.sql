-- Nueva columna preferred_language en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT
  CHECK (preferred_language IN ('en', 'es'))
  DEFAULT 'es';
