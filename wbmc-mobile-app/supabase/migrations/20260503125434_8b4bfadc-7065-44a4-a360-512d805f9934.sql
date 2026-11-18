DROP INDEX IF EXISTS public.videos_youtube_video_id_key;
ALTER TABLE public.videos ADD CONSTRAINT videos_youtube_video_id_key UNIQUE (youtube_video_id);