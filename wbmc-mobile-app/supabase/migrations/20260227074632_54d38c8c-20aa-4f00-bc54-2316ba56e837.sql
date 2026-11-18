
-- Bible notes table
CREATE TABLE public.bible_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_name TEXT NOT NULL,
  chapter_reference TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  content TEXT NOT NULL,
  reminder_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes" ON public.bible_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.bible_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.bible_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.bible_notes FOR DELETE USING (auth.uid() = user_id);

-- Bible bookmarks table
CREATE TABLE public.bible_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_name TEXT NOT NULL,
  chapter_reference TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  label TEXT,
  reminder_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON public.bible_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarks" ON public.bible_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookmarks" ON public.bible_bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.bible_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updating bible_notes updated_at
CREATE OR REPLACE FUNCTION public.update_bible_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bible_notes_updated_at
BEFORE UPDATE ON public.bible_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_bible_notes_updated_at();
