-- Migration: Add name_es to workouts table
-- Run this in the Supabase Dashboard SQL Editor

ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS name_es text;

-- Down Migration (if ever needed):
-- ALTER TABLE public.workouts DROP COLUMN IF EXISTS name_es;
