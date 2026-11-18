-- Bible chapter cache
CREATE TABLE public.bible_chapter_cache (
  chapter_id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  content TEXT NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_chapter_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bible chapter cache"
ON public.bible_chapter_cache FOR SELECT
USING (true);

-- Ministries cache (single row keyed by source)
CREATE TABLE public.ministries_cache (
  id TEXT PRIMARY KEY DEFAULT 'wbmc',
  data JSONB NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ministries_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ministries cache"
ON public.ministries_cache FOR SELECT
USING (true);
