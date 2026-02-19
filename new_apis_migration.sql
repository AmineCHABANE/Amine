-- ═══════════════════════════════════════
-- AmineAPI — New APIs Migration
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════

-- Short URLs table (for URL shortener API)
CREATE TABLE IF NOT EXISTS short_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_short_urls_code ON short_urls(code);
CREATE INDEX IF NOT EXISTS idx_short_urls_user ON short_urls(user_id);

-- Function to increment clicks
CREATE OR REPLACE FUNCTION increment_clicks(url_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE short_urls SET clicks = clicks + 1 WHERE id = url_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add endpoint column to usage_logs if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usage_logs' AND column_name = 'endpoint'
  ) THEN
    ALTER TABLE usage_logs ADD COLUMN endpoint VARCHAR(100) DEFAULT '/api/chat';
  END IF;
END $$;

-- Add status_code column to usage_logs if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usage_logs' AND column_name = 'status_code'
  ) THEN
    ALTER TABLE usage_logs ADD COLUMN status_code INTEGER DEFAULT 200;
  END IF;
END $$;

-- RLS for short_urls
ALTER TABLE short_urls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own short URLs" ON short_urls;
DROP POLICY IF EXISTS "Users can create short URLs" ON short_urls;

CREATE POLICY "Users can view own short URLs"
  ON short_urls FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create short URLs"
  ON short_urls FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant service role access
GRANT ALL ON short_urls TO service_role;
GRANT EXECUTE ON FUNCTION increment_clicks TO service_role;

-- Fix: Unique constraint on api_keys.user_id (required for upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_user_id_unique'
  ) THEN
    ALTER TABLE api_keys ADD CONSTRAINT api_keys_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Fix: Add stripe_session_id unique index for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_logs_session
  ON payment_logs(stripe_session_id);

-- ✅ Done! New APIs ready.
