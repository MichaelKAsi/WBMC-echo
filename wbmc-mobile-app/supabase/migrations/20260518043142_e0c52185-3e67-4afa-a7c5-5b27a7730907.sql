CREATE TABLE public.bible_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chapter_id TEXT NOT NULL,
  chapter_reference TEXT NOT NULL,
  book_name TEXT NOT NULL,
  selected_text TEXT NOT NULL,
  color TEXT NOT NULL,
  start_offset INTEGER NOT NULL DEFAULT 0,
  end_offset INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own highlights"
ON public.bible_highlights FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own highlights"
ON public.bible_highlights FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights"
ON public.bible_highlights FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights"
ON public.bible_highlights FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_bible_highlights_user_chapter
ON public.bible_highlights(user_id, chapter_id);