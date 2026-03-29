-- Migration: exercise chat rate limiting log
-- Stores only metadata (user_id + exercise_id + timestamp) — NO message content.
-- Used by /api/chat/exercise to enforce 10 msg/user/hour rate limit.

CREATE TABLE IF NOT EXISTS exercise_chat_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient rate limit check: "count rows WHERE user_id = X AND created_at >= 1h ago"
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_time
  ON exercise_chat_logs (user_id, created_at DESC);

-- RLS: users can only see their own logs
ALTER TABLE exercise_chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own chat logs"
  ON exercise_chat_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own chat logs"
  ON exercise_chat_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
