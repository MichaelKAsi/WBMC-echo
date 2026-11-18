
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS videos_youtube_video_id_key
  ON public.videos (youtube_video_id)
  WHERE youtube_video_id IS NOT NULL;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
