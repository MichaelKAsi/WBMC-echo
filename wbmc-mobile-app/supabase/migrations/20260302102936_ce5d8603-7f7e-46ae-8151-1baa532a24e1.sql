
-- Pastor post likes
CREATE TABLE public.pastor_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.pastor_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.pastor_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pastor post likes" ON public.pastor_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON public.pastor_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.pastor_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Pastor post comments
CREATE TABLE public.pastor_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.pastor_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pastor_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pastor post comments" ON public.pastor_post_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON public.pastor_post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.pastor_post_comments FOR DELETE USING (auth.uid() = user_id);

-- Add scheduled_at column to pastor_posts
ALTER TABLE public.pastor_posts ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
