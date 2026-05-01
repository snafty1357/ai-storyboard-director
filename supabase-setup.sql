-- =========================================
-- Supabase 初期セットアップ SQL
-- Supabase ダッシュボード > SQL Editor で実行
-- =========================================

-- 1) Storage バケット作成（公開バケット）
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('collages', 'collages', true),
  ('keyframes', 'keyframes', true),
  ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2) 履歴テーブル
CREATE TABLE IF NOT EXISTS public.history (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  input jsonb,
  output jsonb,
  generated_images jsonb,
  generated_video text,
  collage_result text,
  cost jsonb,
  durations jsonb
);

CREATE INDEX IF NOT EXISTS history_created_at_idx ON public.history (created_at DESC);

-- 3) RLS（仮: anonキーで全操作可。認証導入後に絞る）
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS history_anon_all ON public.history;
CREATE POLICY history_anon_all ON public.history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4) Storage RLS（公開バケット用 read/write）
DROP POLICY IF EXISTS storage_public_read ON storage.objects;
CREATE POLICY storage_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id IN ('collages', 'keyframes', 'videos'));

DROP POLICY IF EXISTS storage_anon_write ON storage.objects;
CREATE POLICY storage_anon_write ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id IN ('collages', 'keyframes', 'videos'));
