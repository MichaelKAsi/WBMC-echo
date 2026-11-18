-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gallery_slides table
CREATE TABLE public.gallery_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  google_drive_link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_slides ENABLE ROW LEVEL SECURITY;

-- Allow public read access to videos
CREATE POLICY "Anyone can view videos"
ON public.videos FOR SELECT
USING (true);

-- Allow public insert/delete for videos (admin will manage)
CREATE POLICY "Anyone can insert videos"
ON public.videos FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete videos"
ON public.videos FOR DELETE
USING (true);

-- Allow public read access to gallery slides
CREATE POLICY "Anyone can view gallery slides"
ON public.gallery_slides FOR SELECT
USING (true);

-- Allow public insert/delete for gallery slides (admin will manage)
CREATE POLICY "Anyone can insert gallery slides"
ON public.gallery_slides FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete gallery slides"
ON public.gallery_slides FOR DELETE
USING (true);