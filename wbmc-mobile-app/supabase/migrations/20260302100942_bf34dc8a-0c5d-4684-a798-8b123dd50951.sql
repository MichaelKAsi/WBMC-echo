
-- Create pastor_posts table
CREATE TABLE public.pastor_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
  media_type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pastor_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view pastor posts
CREATE POLICY "Anyone can view pastor posts"
  ON public.pastor_posts FOR SELECT
  USING (true);

-- Only pastors can insert their own posts
CREATE POLICY "Pastors can insert own posts"
  ON public.pastor_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'pastor'::app_role));

-- Only pastors can update their own posts
CREATE POLICY "Pastors can update own posts"
  ON public.pastor_posts FOR UPDATE
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'pastor'::app_role));

-- Only pastors can delete their own posts
CREATE POLICY "Pastors can delete own posts"
  ON public.pastor_posts FOR DELETE
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'pastor'::app_role));

-- Create storage bucket for pastor media
INSERT INTO storage.buckets (id, name, public) VALUES ('pastor-media', 'pastor-media', true);

-- Storage policies for pastor media
CREATE POLICY "Anyone can view pastor media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pastor-media');

CREATE POLICY "Pastors can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pastor-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Pastors can delete own media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pastor-media' AND auth.uid()::text = (storage.foldername(name))[1]);
