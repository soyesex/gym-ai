-- Migration: add exercise detail fields
-- Adds columns needed for the exercise detail page and AI content generation.
-- All columns are nullable (NULL default) so existing rows are unaffected.
-- Run /api/setup-exercise-details after this migration to populate content.

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS steps        jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS steps_es     jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS risks        jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS risks_es     jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS detailed_tips     jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS detailed_tips_es  jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS youtube_url  text  DEFAULT NULL;

-- Create index for efficient "find exercises without steps" queries
-- (used by /api/setup-exercise-details to find exercises to process)
CREATE INDEX IF NOT EXISTS idx_exercises_steps_null
  ON exercises (id)
  WHERE steps IS NULL;
